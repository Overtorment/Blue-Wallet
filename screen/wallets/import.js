/* global alert */
import React, { useEffect, useState } from 'react';
import { Platform, Dimensions, View, Keyboard, StatusBar, StyleSheet } from 'react-native';
import {
  BlueFormMultiInput,
  BlueButtonLink,
  BlueFormLabel,
  BlueDoneAndDismissKeyboardInputAccessory,
  BlueButton,
  SafeBlueArea,
  BlueSpacing20,
  BlueNavigationStyle,
  BlueLoadingHook,
} from '../../BlueComponents';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Privacy from '../../Privacy';
import { useNavigation, useRoute, useTheme } from '@react-navigation/native';
import WalletImport from '../../class/wallet-import';
import Clipboard from '@react-native-community/clipboard';
// import ActionSheet from '../ActionSheet';
import ImagePicker from 'react-native-image-picker';
import loc from '../../loc';
import { getSystemName } from 'react-native-device-info';
// import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
const LocalQRCode = require('@remobile/react-native-qrcode-local-image');
const { width } = Dimensions.get('window');
const isDesktop = getSystemName() === 'Mac OS X';

const WalletsImport = () => {
  const [isToolbarVisibleForAndroid, setIsToolbarVisibleForAndroid] = useState(false);
  const route = useRoute();
  const label = (route.params && route.params.label) || '';
  const [importText, setImportText] = useState(label);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    root: {
      flex: 1,
      paddingTop: 40,
      backgroundColor: colors.elevated,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.elevated,
    },
  });

  useEffect(() => {
    Privacy.enableBlur();
    Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setIsToolbarVisibleForAndroid(true));
    Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setIsToolbarVisibleForAndroid(false));
    return () => {
      Keyboard.removeListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide');
      Keyboard.removeListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow');
      Privacy.disableBlur();
    };
  }, []);

  const importButtonPressed = () => {
    if (importText.trim().length === 0) {
      return;
    }
    importMnemonic(importText);
  };

  /**
   *
   * @param importText
   * @param additionalProperties key-values passed from outside. Used only to set up `masterFingerprint` property for watch-only wallet
   */
  const importMnemonic = (importText, additionalProperties) => {
    setIsLoading(true);
    try {
      WalletImport.processImportText(importText, additionalProperties);
      navigation.dangerouslyGetParent().pop();
    } catch (error) {
      alert(loc.wallets.import_error);
      ReactNativeHapticFeedback.trigger('notificationError', { ignoreAndroidSystemSettings: false });
      setIsLoading(false);
    }
  };

  /**
   *
   * @param value
   * @param additionalProperties key-values passed from outside. Used only to set up `masterFingerprint` property for watch-only wallet
   */
  const onBarScanned = (value, additionalProperties) => {
    setImportText(value);
    importMnemonic(value, additionalProperties);
  };

  const importScan = () => {
    if (isDesktop) {
      showActionSheet();
    } else {
      navigation.navigate('ScanQRCodeRoot', {
        screen: 'ScanQRCode',
        params: {
          launchedBy: route.name,
          onBarScanned: onBarScanned,
          showFileImportButton: true,
        },
      });
    }
  };

  const choosePhoto = () => {
    ImagePicker.launchImageLibrary(
      {
        title: null,
        mediaType: 'photo',
        takePhotoButtonTitle: null,
      },
      response => {
        if (response.uri) {
          const uri = Platform.OS === 'ios' ? response.uri.toString().replace('file://', '') : response.path.toString();
          LocalQRCode.decode(uri, (error, result) => {
            if (!error) {
              onBarScanned(result);
            } else {
              alert(loc.send.qr_error_no_qrcode);
            }
          });
        }
      },
    );
  };

  const takePhoto = () => {
    ImagePicker.launchCamera(
      {
        title: null,
        mediaType: 'photo',
        takePhotoButtonTitle: null,
      },
      response => {
        if (response.uri) {
          const uri = Platform.OS === 'ios' ? response.uri.toString().replace('file://', '') : response.path.toString();
          LocalQRCode.decode(uri, (error, result) => {
            if (!error) {
              onBarScanned(result);
            } else {
              alert(loc.send.qr_error_no_qrcode);
            }
          });
        }
      },
    );
  };

  const copyFromClipbard = async () => {
    onBarScanned(await Clipboard.getString());
  };

  const handleImportFileButtonPressed = async () => {
    // try {
    //   const res = await DocumentPicker.pick({
    //     type: [DocumentPicker.types.allFiles],
    //   });

    //   const file = await RNFS.readFile(res.uri);
    //   if (file) {
    //     onBarScanned(file);
    //   } else {
    //     throw new Error();
    //   }
    // } catch (err) {
    //   if (!DocumentPicker.isCancel(err)) {
    //     alert(loc.wallets.import_error);
    //   }
    }
  // };

  const showActionSheet = async () => {
    const isClipboardEmpty = (await Clipboard.getString()).replace(' ', '').length === 0;
    let copyFromClipboardIndex;
    if (Platform.OS === 'ios') {
      const options = [loc._.cancel, 'Take Photo', loc.wallets.list_long_choose];
      if (!isClipboardEmpty) {
        options.push(loc.wallets.list_long_clipboard);
        copyFromClipboardIndex = options.length - 1;
      }

      options.push(loc.wallets.import_file);
      const impoortFileButtonIndex = options.length - 1;

      // ActionSheet.showActionSheetWithOptions({ options, cancelButtonIndex: 0 }, buttonIndex => {
      //   if (buttonIndex === 1) {
      //     takePhoto();
      //   } else if (buttonIndex === 2) {
      //     choosePhoto();
      //   } else if (buttonIndex === copyFromClipboardIndex) {
      //     copyFromClipbard();
      //   } else if (impoortFileButtonIndex) {
      //     handleImportFileButtonPressed();
      //   }
      // });
    }
  };

  return (
    <SafeBlueArea forceInset={{ horizontal: 'always' }} style={styles.root}>
      <StatusBar barStyle="default" />
      <BlueSpacing20 />
      <BlueFormLabel>{loc.wallets.import_explanation}</BlueFormLabel>
      <BlueSpacing20 />
      <BlueFormMultiInput
        testID="MnemonicInput"
        value={importText}
        contextMenuHidden={getSystemName() !== 'Mac OS X'}
        editable={!isLoading}
        onChangeText={setImportText}
        inputAccessoryViewID={BlueDoneAndDismissKeyboardInputAccessory.InputAccessoryViewID}
      />

      <BlueSpacing20 />
      <View style={styles.center}>
        {!isLoading ? (
          <>
            <BlueButton
              testID="DoImport"
              disabled={importText.trim().length === 0}
              title={loc.wallets.import_do_import}
              buttonStyle={{
                width: width / 1.5,
              }}
              onPress={importButtonPressed}
            />
            <BlueSpacing20 />
            <BlueButtonLink title={loc.wallets.import_scan_qr} onPress={importScan} />
          </>
        ) : (
          <BlueLoadingHook />
        )}
      </View>
      {Platform.select({
        ios: (
          <BlueDoneAndDismissKeyboardInputAccessory
            onClearTapped={() => {
              setImportText('');
              Keyboard.dismiss();
            }}
            onPasteTapped={text => {
              setImportText(text);
              Keyboard.dismiss();
            }}
          />
        ),
        android: isToolbarVisibleForAndroid && (
          <BlueDoneAndDismissKeyboardInputAccessory
            onClearTapped={() => {
              setImportText('');
              Keyboard.dismiss();
            }}
            onPasteTapped={text => {
              setImportText(text);
              Keyboard.dismiss();
            }}
          />
        ),
      })}
    </SafeBlueArea>
  );
};

WalletsImport.navigationOptions = () => ({
  ...BlueNavigationStyle(),
  title: loc.wallets.import_title,
});
export default WalletsImport;
