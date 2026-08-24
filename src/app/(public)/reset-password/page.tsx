import { updatePassword } from '@/app/actions/auth';

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <form action={updatePassword} className="flex flex-col gap-4">
        <input name="password" type="password" placeholder="New Password" required className="border p-2" />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Update Password</button>
      </form>
    </div>
  );
}
