import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Cấu hình cách hiển thị thông báo khi app đang mở
const notificationHandler: Notifications.NotificationHandler = {
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
};

Notifications.setNotificationHandler(notificationHandler);

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleDailyNotifications() {
  // Xóa các thông báo đã hẹn trước đó để tránh trùng lặp
  await Notifications.cancelAllScheduledNotificationsAsync();

  const scenarios = [
    {
      id: 'morning',
      title: 'Chào buổi sáng Dĩ! 👋',
      body: 'Còn 15 phút trước khi bắt đầu ngày mới? Quét tủ lạnh để AI gợi ý bữa sáng cấp tốc nhé!',
      hour: 7,
      minute: 0,
    },
    {
      id: 'lunch',
      title: 'Dĩ ăn trưa chưa? 🍱',
      body: 'Đang có 5 công thức Bento văn phòng cực dễ làm chờ bạn khám phá.',
      hour: 11,
      minute: 0,
    },
    {
      id: 'dinner',
      title: 'Trời Cao Lãnh đang se lạnh... 🍲',
      body: 'Làm nồi lẩu Thái chua cay thì tuyệt vời Dĩ ơi! Xem công thức ngay.',
      hour: 17,
      minute: 30,
    },
    {
      id: 'late_night',
      title: 'Đang code muộn mà buồn miệng? 🍏',
      body: 'Gợi ý ngay 3 món snack healthy ăn đêm không lo tăng cân.',
      hour: 22,
      minute: 0,
    },
  ];

  for (const scenario of scenarios) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: scenario.title,
        body: scenario.body,
        sound: true,
        data: { scenarioId: scenario.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: scenario.hour,
        minute: scenario.minute,
      },
    });
  }
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Thông báo thử nghiệm 🚀',
      body: 'Hệ thống thông báo thông minh đã được thiết lập thành công!',
    },
    trigger: null, // Gửi ngay lập tức
  });
}
