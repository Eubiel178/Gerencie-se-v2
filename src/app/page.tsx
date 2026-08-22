import Link from "next/link";

const LandingPage = () => {
  return (
    <div>
      <h1>Gerencie-se</h1>

      <Link href="/home">Home</Link>
      <Link href="/login">login</Link>
      <Link href="/register">Register</Link>
    </div>
  );
};

export default LandingPage;
