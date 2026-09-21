import { prisma } from '../shared/prisma';
import { Errors } from '../shared/errors';
import type { z } from 'zod';
import type { createAddressSchema } from '../validators/commerce.validator';

type AddressInput = z.infer<typeof createAddressSchema>;

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createAddress(userId: string, input: AddressInput) {
  if (input.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.address.create({
    data: {
      userId,
      label: input.label,
      fullName: input.fullName,
      phone: input.phone,
      province: input.province,
      district: input.district,
      sector: input.sector,
      cell: input.cell,
      village: input.village,
      street: input.street,
      landmark: input.landmark,
      kgAddress: input.kgAddress,
      building: input.building,
      apartment: input.apartment,
      googleMapsUrl: input.googleMapsUrl,
      instructions: input.instructions,
      isDefault: input.isDefault ?? false,
    },
  });
}

export async function getAddressForUser(userId: string, addressId: string) {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) throw Errors.notFound('Address');
  return address;
}
