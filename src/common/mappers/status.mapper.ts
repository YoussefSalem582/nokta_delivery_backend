import { RideStatus, DeliveryStatus, DriverAvailability } from '@prisma/client';

const rideStatusMap: Record<RideStatus, string> = {
  [RideStatus.REQUESTED]: 'requested',
  [RideStatus.ACCEPTED]: 'accepted',
  [RideStatus.DRIVER_ARRIVING]: 'driverArrived',
  [RideStatus.IN_PROGRESS]: 'inProgress',
  [RideStatus.COMPLETED]: 'completed',
  [RideStatus.CANCELLED]: 'cancelled',
};

const rideStatusReverse: Record<string, RideStatus> = {
  requested: RideStatus.REQUESTED,
  accepted: RideStatus.ACCEPTED,
  driverArrived: RideStatus.DRIVER_ARRIVING,
  inProgress: RideStatus.IN_PROGRESS,
  completed: RideStatus.COMPLETED,
  cancelled: RideStatus.CANCELLED,
};

export function toTripStatus(status: RideStatus): string {
  return rideStatusMap[status];
}

export function fromTripStatus(status: string): RideStatus {
  return rideStatusReverse[status] ?? RideStatus.REQUESTED;
}

const deliveryStatusMap: Record<DeliveryStatus, string> = {
  [DeliveryStatus.REQUESTED]: 'requested',
  [DeliveryStatus.ASSIGNED]: 'assigned',
  [DeliveryStatus.PICKED_UP]: 'pickedUp',
  [DeliveryStatus.IN_TRANSIT]: 'inTransit',
  [DeliveryStatus.DELIVERED]: 'delivered',
  [DeliveryStatus.CANCELLED]: 'cancelled',
};

export function toDeliveryStatus(status: DeliveryStatus): string {
  return deliveryStatusMap[status];
}

const availabilityMap: Record<DriverAvailability, string> = {
  [DriverAvailability.OFFLINE]: 'offline',
  [DriverAvailability.ONLINE]: 'online',
  [DriverAvailability.ON_TRIP]: 'onTrip',
};

export function toAvailability(status: DriverAvailability): string {
  return availabilityMap[status];
}

export function fromAvailability(status: string): DriverAvailability {
  const map: Record<string, DriverAvailability> = {
    offline: DriverAvailability.OFFLINE,
    online: DriverAvailability.ONLINE,
    onTrip: DriverAvailability.ON_TRIP,
  };
  return map[status] ?? DriverAvailability.OFFLINE;
}

export interface RideWithRelations {
  id: string;
  riderId: string;
  driverId: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: unknown;
  pickupLng: unknown;
  dropoffLat: unknown;
  dropoffLng: unknown;
  status: RideStatus;
  fare: unknown;
  distanceKm: unknown;
  etaMinutes: number | null;
  paymentMethodKey: string | null;
  rideTierKey: string | null;
  driverLat: unknown;
  driverLng: unknown;
  createdAt: Date;
  updatedAt: Date;
  rider?: { id: string; name: string; phone: string; avatarUrl: string | null };
  driver?: {
    id: string;
    name: string;
    phone: string;
    avatarUrl: string | null;
    driverProfile?: {
      rating: unknown;
      vehicle?: { makeModel: string; vehicleType: string } | null;
    } | null;
  } | null;
}

export function toTripJson(ride: RideWithRelations) {
  const driver = ride.driver;
  const driverProfile = driver?.driverProfile;
  const vehicle = driverProfile?.vehicle;

  return {
    id: ride.id,
    pickupAddress: ride.pickupAddress,
    dropoffAddress: ride.dropoffAddress,
    pickupLat: Number(ride.pickupLat),
    pickupLng: Number(ride.pickupLng),
    dropoffLat: Number(ride.dropoffLat),
    dropoffLng: Number(ride.dropoffLng),
    status: toTripStatus(ride.status),
    riderId: ride.riderId,
    driverId: ride.driverId ?? undefined,
    fare: Number(ride.fare),
    distanceKm: ride.distanceKm != null ? Number(ride.distanceKm) : undefined,
    etaMinutes: ride.etaMinutes ?? undefined,
    paymentMethodKey: ride.paymentMethodKey ?? undefined,
    rideTierKey: ride.rideTierKey ?? undefined,
    driverLat: ride.driverLat != null ? Number(ride.driverLat) : undefined,
    driverLng: ride.driverLng != null ? Number(ride.driverLng) : undefined,
    driverName: driver?.name,
    driverPhone: driver?.phone,
    driverAvatarUrl: driver?.avatarUrl ?? undefined,
    driverRating: driverProfile ? Number(driverProfile.rating) : undefined,
    driverVehicle: vehicle ? `${vehicle.makeModel} (${vehicle.vehicleType})` : undefined,
    createdAt: ride.createdAt.toISOString(),
    updatedAt: ride.updatedAt.toISOString(),
  };
}
