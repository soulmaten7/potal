import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: COLORS.text,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarShowLabel: false,
      tabBarStyle: { backgroundColor: COLORS.background, borderTopColor: COLORS.border, borderTopWidth: 0.5 },
    }}>
      <Tabs.Screen name="index" options={{
        headerShown: false,
        tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={color} />,
      }} />
      <Tabs.Screen name="explore" options={{
        headerShown: false,
        tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'search' : 'search-outline'} size={26} color={color} />,
      }} />
      <Tabs.Screen name="create" options={{
        headerShown: false,
        tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={30} color={color} />,
      }} />
      <Tabs.Screen name="notifications" options={{
        headerShown: false,
        tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'heart' : 'heart-outline'} size={26} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        headerShown: false,
        tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={28} color={color} />,
      }} />
    </Tabs>
  );
}
