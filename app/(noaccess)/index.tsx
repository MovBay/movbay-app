import { ActivityIndicator, StyleSheet, View, Image } from "react-native";
import React from "react";

const InitialScreen = () => {
  
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/icon2.png")}
        alt="Movbay Logo"
        style={{
          width: 250,
          height: 250,
          marginBottom: 25
        }}
      />
      <ActivityIndicator
        size={45}
        animating={true}
        color={'white'}
      />
    </View>
  );
};

export default InitialScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F75F15",
    alignItems: "center",
    justifyContent: "center",
  },
});
