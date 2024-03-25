import { InferInsertModel, InferSelectModel, and, eq } from "drizzle-orm";
import argon2 from "argon2";
import { db } from "../../db";
import { applications, roles, users, usersToRoles } from "../../db/schema";

export async function createUser(data: InferInsertModel<typeof users>) {
  const hashPassword = await argon2.hash(data.password);

  const user = await db
    .insert(users)
    .values({
      ...data,
      password: hashPassword,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      applicationId: applications.id,
    });

  return user[0];
}

export async function getUserByApplication(applicationId: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.applicationId, applicationId));
  return result;
}

export async function assingRoleToUser(
  data: InferInsertModel<typeof usersToRoles>
) {
  const result = await db.insert(usersToRoles).values(data).returning();
  return result[0];
}

export async function getUserByEmail({
  email,
  applicationId,
}: {
  email: string;
  applicationId: string;
}) {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      applicationId: users.applicationId,
      roleId: roles.id,
      password: users.password,
      permissions: roles.permissions,
    })
    .from(users)
    .where(and(eq(users.email, email), eq(users.applicationId, applicationId)))
    .leftJoin(
      usersToRoles,
      and(
        eq(usersToRoles.userId, users.id),
        eq(usersToRoles.applicationId, users.applicationId)
      )
    )
    .leftJoin(roles, eq(roles.id, usersToRoles.roleId));

  if (!result.length) {
    return null;
  }

  const user = result.reduce((acc, curr) => {
    if (!acc.id) {
      return {
        ...curr,
        permissions: new Set(curr.permissions),
      };
    }

    if (!curr.permissions) {
      return acc;
    }

    for (const permision of curr.permissions) {
      acc.permissions.add(permision);
    }

    return acc;
  }, {} as Omit<(typeof result)[number], "permissions"> & { permissions: Set<string> });

  return {
    ...user,
    permissions: Array.from(user.permissions)
  };
}
