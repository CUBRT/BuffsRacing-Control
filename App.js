import React from 'react';
import {Node} from 'react';
import {
  PermissionsAndroid,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  Button,
  useColorScheme,
  View,
  Platform,
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

import {request, requestMultiple, PERMISSIONS, RESULTS} from 'react-native-permissions'

//import { TextInput } from 'react-native';
import { TextInput } from 'react-native-paper'; // TextInput component provided by react-native does not render, and I cannot waste more time on this weirdass bug.

import Header from "./components/header";

import styles from './components/styles';

import Modal from "react-native-modal";

import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';
import { Buffer } from "buffer"
import { FFmpegKit,ReturnCode } from 'ffmpeg-kit-react-native';


import DefaultPreference from 'react-native-default-preference';


import KeepAwake from '@sayem314/react-native-keep-awake';

import Section from "./components/layoutStuff.js";

import * as Sentry from '@sentry/react-native';
import { CaptureConsole } from "@sentry/integrations";


Sentry.init({ 
  dsn: 'https://bbc078d511424858b0ebe58eb135b68c@o126149.ingest.sentry.io/6202127', 
  integrations: [
    new CaptureConsole({
      levels: ["log", "warn", "error"],
    }),
  ],
});



const cameraPattern = "ralphiecam-00";

/*
const requestCameraPermission = async () => {
  try {
    const granted = await PermissionsAndroid.requestMultiple(
      [
        Permissions.Android.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      ] 
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Camera permission granted");
    }
  } catch (err) {
    console.warn(err)
  }
};
*/

const toastMessage = (title,message,type="success") => {
  Toast.show({
    type: type,
    position: "top",
    text1: title,
    text2: message
})
}

const requestCameraPermission = async () => {
  if (Platform.OS === 'ios') {
    requestMultiple([PERMISSIONS.IOS.CAMERA,PERMISSIONS.IOS.MICROPHONE]).then((statuses) => {
      console.log('Camera', statuses[PERMISSIONS.IOS.CAMERA]);
      console.log('Microphone', statuses[PERMISSIONS.IOS.MICROPHONE]);
      if (statuses[PERMISSIONS.IOS.CAMERA] === RESULTS.GRANTED) {
        console.log("Camera permission granted");
        toastMessage("Camera Permission","Already Granted")
      } else {
        toastMessage("Camera Permission",`${statuses[PERMISSIONS.IOS.CAMERA]}`,"error")
      }
      if (statuses[PERMISSIONS.IOS.MICROPHONE] === RESULTS.GRANTED) {
        console.log("Microphone permission granted");
        toastMessage("Microphone Permission","Already Granted")
      } else {
        toastMessage("Microphone Permission",`${statuses[PERMISSIONS.IOS.MICROPHONE]}`,"error")
      }
    })
  } else {
    try {
      const granted = await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.CAMERA,PermissionsAndroid.PERMISSIONS.RECORD_AUDIO],
        {
          title: "BuffsControl Camera And Microphone Permission",
          message:
            "Buffs Control App needs access to your camera " +
            "so you can stream your camera.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      if (granted["android.permission.CAMERA"] === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the camera");
        toastMessage("Camera Permission","Already Granted")
      } else {
        console.log("Camera permission denied");
        toastMessage("Camera Permission","Denied","error")
      }
    } catch (err) {
      console.warn(err);
    }
}
};

const requestBluetoothPermission = async () => {
  try {
    const granted = await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE],
      {
        title: "Buffs Control App Bluetooth Permission",
        message:
          "Buffs Control App needs access to your bluetooth " +
          "so you can connect to ELM327 Adapters.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
          })
    if (granted["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("You can use the bluetooth");
      toastMessage("Bluetooth Permission","Already Granted")
    } else {
      toastMessage("Bluetooth Permission","Denied","error")
    }
  } catch (err) {
    console.warn(err);
  }
};


const requestLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then((result) => {
      console.log(result);
      if (result === RESULTS.GRANTED ) {
        console.log("Location Permission Granted");
        toastMessage("Location Permission","Already Granted")
      } else {
        console.log("Location Permission Denied");
        toastMessage("Location Permission",`${result}`,"error")
      }
    })
  } else {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Location permission granted");
      toastMessage("Location Permission","Already Granted")
      Geolocation.getCurrentPosition(
        (position) => {
          console.log(position);
        },
        (error) => {
          console.error(error.code,error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      console.error("Location permission denied");
      toastMessage("Location Permission","Denied","error")
    }
  } catch (err) {
    console.warn(err)
  }
}
};

const getLocation = (setDeviceLatitude,setDeviceLongitude) => {
  try {
    Geolocation.getCurrentPosition(
      (position) => {
        console.log(position);
        setDeviceLatitude(position.coords.latitude);
        setDeviceLongitude(position.coords.longitude);
      }
    ),
    (error) => {
      console.error(error.code,error.message);
    }
  }
  catch (err) {
    console.warn(err)
  }
};



const testSendLocation = (deviceLatitude,deviceLongitude,grafanaKey,grafanaHost,grafanaUser,props) => {
  var metrics = [{
    "name": "cubrt.blueline.latitude",
    "value": deviceLatitude,
    "interval": 1,
    "metric": "cubrt.blueline.latitude",
    time: Math.round(Date.now() / 1000)
  },
  {
    "name": "cubrt.blueline.longitude",
    "value": deviceLongitude,
    "interval": 1,
    "metric": "cubrt.blueline.longitude",
    time: Math.round(Date.now() / 1000)
  }]

  var username = grafanaUser;

  const token = `${username}:${grafanaKey}`;
  const base64 = Buffer.from(token).toString('base64');

  console.log(`Trying to log to ${grafanaHost}`)
  fetch(`${grafanaHost}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Authorization': 'Basic '+ base64
    },
    body: JSON.stringify(metrics)
  })
  .then(res => res.json())
  .then(
    res => {
      console.log(res);
      toastMessage("Grafana",`Published ${res.Published}`)
    }
    
    )
  .catch(function(error) {
    console.error('There has been a problem with your fetch operation: ' + error.message);
     // ADD THIS THROW error
      throw error;
    });

}

const testStreamTwitch = (rtmpURL, props) => {
  FFmpegKit.execute(`-v verbose -t 05:00 -f lavfi -i testsrc -f lavfi -i testsrc -f lavfi -i testsrc -f lavfi -i testsrc -ar 44100 -r 30 -g 60 -keyint_min 60 -b:v 400000 -c:v libx264 -preset medium -bufsize 400k -maxrate 400k -f flv "${rtmpURL}"`).then(async (session) => {
    const returnCode = await session.getReturnCode();
  
    if (ReturnCode.isSuccess(returnCode)) {
  
      // SUCCESS
  
    } else if (ReturnCode.isCancel(returnCode)) {
  
      // CANCEL
  
    } else {
  
      // ERROR
  
    }
  });
};

const experiment = (rtmpURL, props) => {
  if (Platform.OS === 'ios') {
    ffmpeg_command = `-f avfoundation -r 30 -video_size 1280x720 -pixel_format bgr0 -i 0:0 -vcodec h264_videotoolbox -vsync 2 -f flv "${rtmpURL}"`
  } else {
    ffmpeg_command = `-f android_camera -video_size 640x480 -i discarded -r 30 -c:v libx264 -f flv "${rtmpURL}"`
  }
  FFmpegKit.execute(ffmpeg_command).then(async (session) => {
    const returnCode = await session.getReturnCode();
  
    if (ReturnCode.isSuccess(returnCode)) {
  
      // SUCCESS
  
    } else if (ReturnCode.isCancel(returnCode)) {
  
      // CANCEL
  
    } else {
  
      // ERROR
  
    }
  });
};

const testLocation = (props) => {
  Geolocation.getCurrentPosition(
    (position) => {
      var positionCoords = position.coords;
      console.log(positionCoords);
      console.log(positionCoords.latitude);
      toastMessage("Your Latitude and Longitude",`${positionCoords.latitude}, ${positionCoords.longitude}`, "info")
    },
    (error) => {
      console.error(error.code,error.message);
      toastMessage("Location Error",error.message, "error")
    }
    )};

const OGSection = ({children, title}) => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
};





const bluetoothStuff = () => {
  console.log("test");
  
}

const experimentalStuff = () => {
  if (Platform.OS === 'ios') {
    command = `-f avfoundation -list_devices true -i \"\"`
  } else {
    command = `-f android_camera -list_devices true -i ""`
  }
  FFmpegKit.execute(command).then(async (session) => {
    const returnCode = await session.getReturnCode();
  
    if (ReturnCode.isSuccess(returnCode)) {
  
      // SUCCESS
  
    } else if (ReturnCode.isCancel(returnCode)) {
  
      // CANCEL
  
    } else {
  
      // ERROR
  
    }
  });
};

const discoverCameras = () => {
  no_sleep = true;
  var patternToCheck = cameraPattern;
  while (no_sleep) {
    fetch(`http://${patternToCheck}`, {method: 'HEAD'}).then((result) => {
      console.log(result)
      no_sleep = false;
    })
  }
}

var getAndSendLocation = (grafana_username,grafana_key,grafana_host) => {
  try {
    Geolocation.getCurrentPosition(
      (position) => {
        console.log(position);
        var latitude = position.coords.latitude
        var longitude = position.coords.longitude
        var gpsSpeed = position.coords.speed
        var metrics = [{
          "name": "cubrt.blueline.latitude",
          "value": latitude,
          "interval": 1,
          "metric": "cubrt.blueline.latitude",
          "time": Math.round(Date.now() / 1000)
        },
        {
          "name": "cubrt.blueline.longitude",
          "value": longitude,
          "interval": 1,
          "metric": "cubrt.blueline.longitude",
          "time": Math.round(Date.now() / 1000)
        },
        {
          "name": "cubrt.blueline.gpsSpeed",
          "value": gpsSpeed,
          "interval": 1,
          "metric": "cubrt.blueline.gpsSpeed",
          "time": Math.round(Date.now() / 1000)
        }]
        console.log("what the fuck", metrics)
        console.log(metrics)
      
        var username = grafana_username
        const token = `${username}:${grafana_key}`
        const base64 = Buffer.from(token).toString('base64')
      
        fetch(`${grafana_host}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${base64}`
          },
          body: JSON.stringify(metrics)
        }).then(res => res.json())
        .then(
          res => {
            console.log(res);
          }
        )
        .catch(function(error) {
          console.log(error);
        })
      }
    ),
  (error) => {
    console.log(error.code,error.message);
  }
  } catch (err) {
    console.warn(err)
  }
}

const StartTelemetry = (isTelemetry,loopID, setLoopID,grafana_key,grafana_host,grafana_user, props) => {
  console.log(isTelemetry);
  if (isTelemetry) { // idk why but for our case isTelemetry = true means switch is off
    clearInterval(loopID);
    console.log("cleared loop")
  } else {
    const tempLoopID = setInterval(() => {getAndSendLocation(grafana_user,grafana_key,grafana_host)} , 1000);
    setLoopID(tempLoopID);
    console.log("nothing")
  }
}

function Welcome(props) {
  return <Text>Hello, {props.name}</Text>;
}

function SeperatorWithHeader(props) {
  return <View style={{flexDirection: 'row', alignItems: 'center'}}><View style={{flex: 1, height: 1, backgroundColor: 'black'}} /><View><Text style={{fontSize: 24, fontWeight: '600', width: 150, textAlign: 'center'}}>{props.name}</Text></View><View style={{flex: 1, height: 1, backgroundColor: 'black'}} /></View>
}

const logStuff = (isCountedTo, setCountedTo, props) => {
    console.log(isCountedTo);
    setCountedTo(isCountedTo => isCountedTo + 1);
  }

const App: () => Node = () => {

  var [deviceLatitude, setDeviceLatitude] = React.useState(0.0);
  var [deviceLongitude, setDeviceLongitude] = React.useState(0.0);
  var [isTelemetry, setTelemetry] = React.useState(false);
  var [loopID, setLoopID] = React.useState(0);
  var [showingModal, setShowingModal] = React.useState(false);

  var [grafanaKey, setGrafanaKey] = React.useState('your_grafana_key_here');
  var [rtmpURL, setRTMPURL] = React.useState('rtmp://your_rtmp_url_here');
  var [grafanaUser, setGrafanaUser] = React.useState('your_grafana_user_here');
  var [grafanaHost, setGrafanaHost] = React.useState('your_grafana_host_here');

  DefaultPreference.get('grafana_key').then(value => {
    if (value === null) {
      DefaultPreference.set('grafana_key', "your_grafana_key_here")
    } else {
      setGrafanaKey(value)
    }
  })

  DefaultPreference.get('rtmp_url').then(value => {
    if (value === null) {
      DefaultPreference.set('rtmp_url', "rtmp://your_rtmp_url_here")
    } else {
      setRTMPURL(value)
    }
  })

  DefaultPreference.get('grafana_user').then(value => {
    if (value === null) {
      DefaultPreference.set('grafana_user', "your_grafana_user_here")
    } else {
      setGrafanaUser(value)
    }
  })

  DefaultPreference.get('grafana_host').then(value => {
    if (value === null) {
      DefaultPreference.set('grafana_host', "your_grafana_host_here")
    } else {
      setGrafanaHost(value)
    }
  })


  const isDarkMode = useColorScheme() === 'dark';
  const toggleSwitch = () => setTelemetry(previousState => !previousState);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  //const loopFunction = setInterval(logStuff(isCountedTo, setCountedTo), 1000);
  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <KeepAwake />
        <View
          style={[{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }]}>

<Modal isVisible={showingModal} backdropColor={isDarkMode ? Colors.black : Colors.white}>
<ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View style={{ flex: 1, }}>
        <Section title="Configuration" >
        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
          <Text>Grafana API Key:</Text>
          <TextInput
        onChangeText={value => {setGrafanaKey(value); DefaultPreference.set('grafana_key', value)}}
        value={grafanaKey}
        placeholder="Grafana API Key" 
        style={{height: 40, borderColor: 'gray', borderWidth: 1}}
      />
      </View>
      <Text>{"\n"}</Text>
      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
      <Text>Grafana Username:</Text>
          <TextInput
        onChangeText={value => {setGrafanaUser(value); DefaultPreference.set('grafana_user', value)}}
        value={grafanaUser}
        placeholder="useless placeholder"
      />
      </View>
      <Text>{"\n"}</Text>
      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
      <Text>Grafana Host:</Text>
          <TextInput
        onChangeText={value => {setGrafanaHost(value); DefaultPreference.set('grafana_host', value)}}
        value={grafanaHost}
        placeholder="useless placeholder"
      />
      </View>
      <Text>{"\n"}</Text>
      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
      <Text>RTMP URL:</Text>
          <TextInput
        onChangeText={value => {setRTMPURL(value); DefaultPreference.set('rtmp_url', value)}}
        value={rtmpURL}
        placeholder="useless placeholder"
      />
      </View>
      <Text>{"\n"}</Text>
          <Button onPress={() => {setShowingModal(false)}}  title="Close" />
          </Section>
        </View>
        </ScrollView>
      </Modal>
          
          <Section title="Permissions">
          <Button title="Location Permissions" onPress={requestLocationPermission} />
          <Text>{"\n"}</Text>
          <Button title="Camera Permissions" onPress={requestCameraPermission} />
          
          {Platform.OS === 'android' && <Text>{"\n"}</Text> && <Button title="Bluetooth Permissions" onPress={requestBluetoothPermission} />}
          </Section>
           
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
          
          <Section title="Test Settings">
            
            <Button title="Test Location" onPress={() => testLocation()}></Button>
            <Text>{"\n"}</Text>
            <Button title="Test Location => Grafana" onPress={() => {getLocation(setDeviceLatitude, setDeviceLongitude); testSendLocation(deviceLatitude,deviceLongitude,grafanaKey,grafanaHost,grafanaUser)}}></Button>
            <Text>{"\n"}</Text>
            <Button title="Test FFMPEG" onPress={() => testStreamTwitch(rtmpURL)}></Button>
            <Text>{"\n"}</Text>
            <Button title="Test Stream" onPress={() => {experiment(rtmpURL)}}></Button>
            <Text>{"\n"}</Text>
            <Button title="Kill FFMPEG" onPress={() => {FFmpegKit.cancel();}}></Button>
            <Text>{"\n"}</Text>
            <Button title="Test Bluetooth" onPress={() => {bluetoothStuff()}}></Button>
            <Text>{"\n"}</Text>
            <Button title="Experiment" onPress={() => experimentalStuff()}></Button>       
          </Section>

          <Section title="Configuration">
            <Button title="Manage API Keys" onPress={() => setShowingModal(true)}></Button>
          </Section>

          <Section title="Run">
            <Text>{"\n"}</Text>
            <Button title={isTelemetry ? 'Stop Telemetry ' : 'Start Telemetry '} onPress={() => {setTelemetry(isTelemetry => !isTelemetry);StartTelemetry(isTelemetry,loopID, setLoopID,grafanaKey,grafanaHost,grafanaUser)}}></Button>
            </Section>

          <Section title="Useless Padding" />
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};


export default Sentry.wrap(App);
