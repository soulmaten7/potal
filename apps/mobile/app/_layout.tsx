import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="auth" />
        ) : (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auction/[id]" options={{ headerShown: true, title: '경매 상세' }} />
            <Stack.Screen name="auction/create" options={{ headerShown: true, title: '경매 등록' }} />
            <Stack.Screen name="post/create" options={{ headerShown: true, title: '새 게시물' }} />
            <Stack.Screen name="user/[username]" options={{ headerShown: true, title: '프로필' }} />
            <Stack.Screen name="chat/index" options={{ headerShown: true, title: '메시지' }} />
            <Stack.Screen name="chat/[roomId]" options={{ headerShown: true, title: '채팅' }} />
            <Stack.Screen name="verification/id-card" options={{ headerShown: true, title: '신분증 인증' }} />
            <Stack.Screen name="verification/face" options={{ headerShown: true, title: '안면인식' }} />
            <Stack.Screen name="review/create" options={{ headerShown: true, title: '리뷰 작성' }} />
            <Stack.Screen name="settings/index" options={{ headerShown: true, title: '설정' }} />
            <Stack.Screen name="settings/account" options={{ headerShown: true, title: '계정' }} />
            <Stack.Screen name="settings/payment" options={{ headerShown: true, title: '결제 관리' }} />
          </>
        )}
      </Stack>
    </GestureHandlerRootView>
  );
}
