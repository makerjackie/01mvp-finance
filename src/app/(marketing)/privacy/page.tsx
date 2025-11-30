import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策",
  description: "隐私政策说明",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">隐私政策</h1>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="lead">您的隐私对我们非常重要。我们的政策是尊重您关于我们在运营网站时可能收集的任何信息的隐私。</p>

        <h3>1. 信息收集</h3>
        <p>
          我们仅在真正需要为您提供服务时才要求提供个人信息。我们在您知情并同意的情况下，通过公平合法的手段收集信息。我们还会让您知道我们收集信息的原因以及我们将如何使用这些信息。
        </p>

        <h3>2. 信息使用</h3>
        <p>
          我们仅在为您提供所需服务所需的时间内保留收集的信息。我们将以商业上可接受的方式保护我们要存储的数据，以防止丢失和被盗，以及未经授权的访问、披露、复制、使用或修改。
        </p>

        <h3>3. 信息共享</h3>
        <p>除非法律要求，否则我们不会公开或与第三方共享任何个人身份信息。</p>

        <h3>4. 外部链接</h3>
        <p>
          我们的网站可能包含指向非我们运营的外部网站的链接。请注意，我们无法控制这些网站的内容和做法，也不能对其各自的隐私政策承担责任或义务。
        </p>

        <h3>5. 用户权利</h3>
        <p>您有权拒绝我们就您的个人信息提出的请求，但我们可能无法为您提供某些所需的服务。</p>

        <h3>6. 同意</h3>
        <p>
          继续使用我们的网站将被视为接受我们关于隐私和个人信息的做法。如果您对我们如何处理用户数据和个人信息有任何疑问，请随时与我们联系。
        </p>
      </div>
    </div>
  );
}
