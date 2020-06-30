import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Button,
  ActivityIndicator,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Config from './src/config/AppConfig'
import DemoNotificationService from './src/services/DemoNotificationService';
import DemoNotificationRegistrationService from './src/services/DemoNotificationRegistrationService';
import AppConfig from './src/config/AppConfig';

declare const global: { HermesInternal: null | {} };

interface IState {
  status: string,
  registeredOS: string,
  registerToken: string,
  isBusy: boolean,
}

class App extends Component<IState> {
  state: IState;
  notificationService: DemoNotificationService;
  notificationRegistrationService: DemoNotificationRegistrationService;
  deviceId: string;

  constructor(props: any) {
    super(props);
    this.deviceId = DeviceInfo.getUniqueId();
    this.state = {
      status: "Push notifications registration status is unknown",
      registeredOS: "",
      registerToken: "",
      isBusy: false,
    };

    this.notificationService = new DemoNotificationService(
      this.onTokenReceived.bind(this),
      this.onNotificationReceived.bind(this),
    );

    this.notificationRegistrationService = new DemoNotificationRegistrationService(
      Config.apiUrl,
      Config.apiKey,
    );
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.isBusy &&
          <ActivityIndicator></ActivityIndicator>
        }
        <View style={styles.button}>
          <Button title="Register" onPress={this.onRegisterButtonPress.bind(this)} disabled={this.state.isBusy} />
        </View>
        <View style={styles.button}>
          <Button title="Deregister" onPress={this.onDeregisterButtonPress.bind(this)} disabled={this.state.isBusy} />
        </View>
      </View>
    );
  }

  async onRegisterButtonPress() {
    if (!this.state.registerToken || !this.state.registeredOS) {
      Alert.alert("The push notifications token wasn't received.");
      return;
    }

    let status: string = "Registering...";
    try {
      this.setState({ isBusy: true, status: status });
      const pnPlatform = this.state.registeredOS == "ios" ? "apns" : "fcm";
      const pnToken = this.state.registerToken;
      const request = {
        installationId: this.deviceId,
        platform: pnPlatform,
        pushChannel: pnToken,
        tags: []
      };
      const response = await this.notificationRegistrationService.registerAsync(request);
      status = `Registered for ${this.state.registeredOS} push notifications`;
    } catch (e) {
      status = `Registration failed: ${e}`;
    }
    finally {
      this.setState({ isBusy: false, status: status });
    }
  }

  async onDeregisterButtonPress() {
    if (!this.notificationService)
      return;

    let status: string = "Deregistering...";
    try {
      this.setState({ isBusy: true, status: status });
      await this.notificationRegistrationService.deregisterAsync(this.deviceId);
      status = "Deregistered from push notifications";
    } catch (e) {
      status = `Deregistration failed: ${e}`;
    }
    finally {
      this.setState({ isBusy: false, status: status });
    }
  }

  onTokenReceived(token: any) {
    this.setState({ registerToken: token.token, registeredOS: token.os, status: `The push notifications token has been received.` });
  }

  onNotificationReceived(notification: any) {
    console.log(`Received a push notification on ${this.state.registeredOS}`);
    this.setState({ status: `Received a push notification...` });

    if (notification.data.message) {
      Alert.alert(AppConfig.appName, `${notification.data.action} action received`);
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: 'flex-end',
    margin: 50,
  },
  button: {
    margin: 5,
    width: "100%",
  }
});

export default App;
