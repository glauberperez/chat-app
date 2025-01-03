import React from 'react';
import { View, Text } from 'react-native';
import VideoChat from '../components/VideoChat';

const App = () => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ textAlign: 'center', fontSize: 20, marginTop: 20 }}>ChatApp</Text>
      <VideoChat />
    </View>
  );
};

export default App;
