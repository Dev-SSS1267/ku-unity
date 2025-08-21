import Head from "next/head";
import LinkinTheBioPage from "../components/linktree";
import { getPageDatawLinkAndSocialData } from "../lib/dbfuncprisma";

export async function getStaticProps() {
  let data;
  // console.log(process.env.NODE_ENV);
  try {
    data = await getPageDatawLinkAndSocialData(false);
    // console.log(data);
  } catch (error) {
    console.log(error.message);
    // 데이터베이스 연결 오류시 기본 데이터 제공
    data = {
      pageData: {
        id: 1,
        handlerText: "Demo User",
        handlerDescription: "Welcome to my link tree",
        avatarUrl: "/images/avatar.jpg",
        bgColor: "#ffffff",
        accentColor: "#000000",
        handlerFontColor: "#000000",
        handlerDescriptionFontColor: "#666666",
        fontFamily: "Arial",
        footerEnabled: true,
        footerText: "Powered by Linkin",
        footerTextColor: "#999999",
        active: true
      },
      linkData: [],
      socialData: []
    };
  }

  return {
    props: {
      pageData: data.pageData,
      linkData: data.linkData,
      socialData: data.socialData,
    },
    // ISR: 60초마다 재생성
    revalidate: 60,
  };
}

export default function Home({ pageData, linkData, socialData }) {
  return (
    <>
      <Head>
        <title> {`${pageData.handlerText}`}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta
          name="og:description"
          content={`${pageData.handlerText}`}
        />
        <meta name="og:site_name" content={pageData.handlerText} />
        <meta
          name="og:title"
          content={`${pageData.handlerText}`}
        />
        <meta name="og:image" content={pageData.avatarUrl} />
      </Head>

      <LinkinTheBioPage
        {...pageData}
        linkData={linkData}
        socialData={socialData}
      />
    </>
  );
}
