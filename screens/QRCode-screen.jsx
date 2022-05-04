import React, { useState, useEffect } from 'react';
// native components
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View, StyleSheet, Dimensions, Modal, Alert, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Feather } from '@expo/vector-icons';
// stylesheet
import { landingPagesOrientation } from '../styles/styles-screens';
import { Colors } from '../styles/styles-colors';
import { FontAwesome } from '@expo/vector-icons';
import { checkInternetConnection } from '../_utils/CheckIfConnectedToInternet';
import CustomButton from '../_utils/ScannerButton';
import CustomButton2 from '../_utils/CustomButton';

// apis
import { createUserVisitationHistroy } from '../apis/qr-code-visitation';

const QRCodeScreen = () => {
  // states
  const [connectedToNet, setConnectedToNet] = useState(false);
  const [hasPermissions, setHasPermission] = useState(false);
  const [message, setMessage] = useState('');
  const [scanned, setScanned] = useState(true);
  const [modalConfirmVisible, setModalConfirmVisible] = useState(false);

  const askForCameraPermission = () => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  };

  // @auto execute upon screen
  useEffect(() => {
    checkInternetConnection().then(res => setConnectedToNet(res));
    // ask for camera permissions
    askForCameraPermission();
  }, []);

  // what happens when we scan the bar code
  const handlerBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setModalConfirmVisible(true);
    // saving scanned history script starts here
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString().split(':');
    const location = await AsyncStorage.getItem('selectedLocation')
    const record = {
      location: location,
      time: `${time[0]}:${time[1]}`,
      action: message,
    };
    console.log(record, data)
    // this will run the api call
    try {
      await createUserVisitationHistroy({ ...record, userId: data, date: date });
    } catch (error) {
      console.log(error)
      Alert.alert(
        'Scanning Failed',
        'Please check you internet connection and try again.',
        [
          {
            text: 'Close',
            style: 'default',
          },
        ],
        {
          cancelable: true,
        }
      );
    }
  };
  

  return (
    <View style={landingPagesOrientation.container}>
      {
        connectedToNet ? (
          <>
            {
              // render when the app is installed the first time
              !hasPermissions && (
                <View style={{ justifyContent: 'center', marginHorizontal: 35, marginVertical: '50%' }}>
                  <Text style={{ textAlign: 'center', fontSize: 20, marginBottom: 20, fontWeight: '700' }}>
                    No camera permission!
                  </Text>
                  <CustomButton2
                    color={Colors.primary}
                    textColor="white"
                    title="Allow Camera"
                    onPress={() => askForCameraPermission()}
                  />
                </View>
              )
            }
            {
              // render if the app has the camera permission
              hasPermissions && (
                <>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.primary }}>
                      Place the QR Code in front of the camera
                    </Text>
                  </View>
                  <View style={{ marginTop: -50 }}>
                    <View style={styles.barcodebox}>
                      <BarCodeScanner
                        style={{
                          height: Dimensions.get('window').height - 70,
                          width: Dimensions.get('window').width - 70,
                        }}
                        onBarCodeScanned={scanned ? undefined : handlerBarCodeScanned}
                      />
                    </View>
                    <View style={{ display: 'flex', flexDirection: "row", justifyContent: "space-around"}}>
                      <CustomButton
                        title="Scan In"
                        color={Colors.primary}
                        textColor="white"
                        onPress={() => {
                          setMessage('Scanned the QR Code')
                          console.log(scanned)
                          setScanned(false);
                          checkInternetConnection().then(res => setConnectedToNet(res));
                        }}
                      />
                      <CustomButton
                        title="Scan Out"
                        color={Colors.red}
                        textColor="white"
                        onPress={() => {
                          setMessage('Leave the venue');
                          setScanned(false);
                          checkInternetConnection().then(res => setConnectedToNet(res));
                        }}
                      />
                    </View>
                    
                  </View>
                  {/* confirm modal for saving the data */}
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalConfirmVisible}
                    onRequestClose={() => {
                      setModalConfirmVisible(!modalConfirmVisible);
                    }}
                  >
                    <View style={styles.centeredView}>
                      <View style={[styles.modalView]}>
                        <View>
                          <Text style={[styles.modalText, { marginBottom: 20 }]}>Data has been recorded!</Text>
                        </View>
                        <FontAwesome name="check-circle" color={Colors.accent} size={100} />
                        <View>
                          <Text style={styles.modalText}>You have scanned the qr code successfully.</Text>
                        </View>
                        <View
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            width: '100%',
                            marginTop: 15,
                          }}
                        >
                          {/* leave button */}
                          <TouchableOpacity
                            style={{ width: '100%' }}
                            onPress={() => {
                              setModalConfirmVisible(!modalConfirmVisible);
                            }}
                          >
                            <View
                              style={{
                                backgroundColor: Colors.accent,
                                height: 50,
                                marginLeft: 10,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 3,
                              }}
                            >
                              <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>Done</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Modal>
                </>
              )
            }
          </>
        ) 
        : 
          <>
            <View
              style={[
                landingPagesOrientation.textContainer,
                landingPagesOrientation.textContaineredCenter,
                landingPagesOrientation.otpContianer,{
                  marginTop: "40%",
                  marginBottom: 20
                }
              ]}
            >
              <Feather name="wifi-off" size={90} color={Colors.primary} />
              <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 17, fontWeight: '700' }}>
                Please make sure that you are connected to a stable internet connection in order to continue.
              </Text>
            </View>
            <CustomButton
              title="Reload page"
              color={'grey'}
              textColor={Colors.lightGrey}
              onPress={() => checkInternetConnection().then(res => setConnectedToNet(res))}
            />
          </>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  barcodebox: {
    marginBottom: 20,
    height: 500,
    width: 500,
    margin: 0,
    overflow: 'hidden',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#000000AA',
  },
  locationText: {
    color: Colors.primary,
    fontSize: 25,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalView: {
    backgroundColor: 'white',
    borderTopRightRadius: 5,
    borderTopLeftRadius: 7,
    padding: 35,
    alignItems: 'center',
    shadowColor: Colors.primary,
    elevation: 5,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    justifyContent: 'center',
  },
  modalText: {
    fontSize: 18,
    marginTop: 25,
    marginBottom: 10,
    fontWeight: '700',
    width: '100%',
  },
});

export default QRCodeScreen;