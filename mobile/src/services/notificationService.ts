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
      title: 'Bữa sáng từ tủ bếp',
      body: 'Quét nhanh nguyên liệu đang có để chọn một món gọn trong 15 phút.',
      hour: 7,
      minute: 0,
    },
    {
      id: 'lunch',
      title: 'Đến giờ dựng bữa trưa',
      body: 'Chọn món no lâu, dễ chuẩn bị và hợp nguyên liệu còn lại trong bếp.',
      hour: 11,
      minute: 0,
    },
    {
      id: 'dinner',
      title: 'Bữa tối nên nấu gì?',
      body: 'Mở tủ bếp hôm nay để xem món nào dùng được nhiều nguyên liệu nhất.',
      hour: 17,
      minute: 30,
    },
    {
      id: 'late_night',
      title: 'Ăn nhẹ cuối ngày',
      body: 'Ưu tiên món nhẹ bụng, ít thao tác và không làm bếp bừa thêm.',
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
