import { resetPassword } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      <form action={resetPassword} className="flex flex-col gap-4">
        <input name="email" type="email" placeholder="Email" required className="border p-2" />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Send Reset Link</button>
      </form>
    </div>
  );
}
