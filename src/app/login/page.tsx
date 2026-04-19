import { prisma } from "@/lib/db";
import { setCurrentUser, getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

async function loginAction(formData: FormData) {
  "use server";
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return;
  await setCurrentUser(userId);
  redirect("/");
}

export default async function LoginPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const current = await getCurrentUser();

  return (
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Mock login</h1>
      <p className="mt-1 text-sm text-gray-500">
        Pick a user to act as. (No real auth yet — this seam will be replaced
        with LDAP/SSO later.)
      </p>

      <form action={loginAction} className="mt-4 space-y-3">
        <label className="block text-sm font-medium">Acting user</label>
        <select
          name="userId"
          defaultValue={current?.id ?? ""}
          className="w-full rounded border border-gray-300 px-3 py-2"
          required
        >
          <option value="" disabled>
            -- choose --
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.department}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="w-full rounded bg-amat-blue px-4 py-2 font-medium text-white hover:bg-amat-blue/90"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
