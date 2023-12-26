import { AppProps } from "next/app";
import "@/styles/globalStyle.css";
import Head from "next/head";

const AppPages: React.FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Gerencie-se</title>
      </Head>

      <Component {...pageProps} />
    </>
  );
};

export default AppPages;
