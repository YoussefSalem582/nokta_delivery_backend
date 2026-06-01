import { RideStatus } from '@prisma/client';

export const NotificationKeys = {
  RIDE: {
    ACCEPTED: {
      title: 'notification.ride.accepted.title',
      body: 'notification.ride.accepted.body',
    },
    DRIVER_ARRIVING: {
      title: 'notification.ride.driver_arriving.title',
      body: 'notification.ride.driver_arriving.body',
    },
    STARTED: {
      title: 'notification.ride.started.title',
      body: 'notification.ride.started.body',
    },
    ENDED: {
      title: 'notification.ride.ended.title',
      body: 'notification.ride.ended.body',
    },
    CANCELLED: {
      title: 'notification.ride.cancelled.title',
      body: 'notification.ride.cancelled.body',
    },
  },
  DELIVERY: {
    ASSIGNED: {
      title: 'notification.delivery.assigned.title',
      body: 'notification.delivery.assigned.body',
    },
    COMPLETED: {
      title: 'notification.delivery.completed.title',
      body: 'notification.delivery.completed.body',
    },
  },
} as const;

const rideStatusNotificationMap: Partial<
  Record<RideStatus, { title: string; body: string; recipient: 'rider' | 'driver' }>
> = {
  [RideStatus.ACCEPTED]: {
    ...NotificationKeys.RIDE.ACCEPTED,
    recipient: 'rider',
  },
  [RideStatus.DRIVER_ARRIVING]: {
    ...NotificationKeys.RIDE.DRIVER_ARRIVING,
    recipient: 'rider',
  },
  [RideStatus.IN_PROGRESS]: {
    ...NotificationKeys.RIDE.STARTED,
    recipient: 'rider',
  },
  [RideStatus.COMPLETED]: {
    ...NotificationKeys.RIDE.ENDED,
    recipient: 'rider',
  },
  [RideStatus.CANCELLED]: {
    ...NotificationKeys.RIDE.CANCELLED,
    recipient: 'rider',
  },
};

export function getRideStatusNotification(status: RideStatus) {
  return rideStatusNotificationMap[status] ?? null;
}
