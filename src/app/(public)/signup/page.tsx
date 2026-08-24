import { signup } from '@/app/actions/auth';

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form action={signup} className="flex flex-col gap-4">
        <input name="first_name" placeholder="First Name" required className="border p-2" />
        <input name="last_name" placeholder="Last Name" required className="border p-2" />
        <input name="email" type="email" placeholder="Email" required className="border p-2" />
        <input name="password" type="password" placeholder="Password" required className="border p-2" />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Sign Up</button>
      </form>
    </div>
  );
}
