import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ArrowRight, Layout, Layers, Smartphone, Monitor, CreditCard } from "lucide-react";

export default function ExampleUIPage() {
  const componentExamples = [
    {
      title: "Immersive Navigation",
      description: "沉浸式导航，带返回按钮和上下文操作。",
      href: "/example-ui/immersive-nav",
      icon: Layout,
    },
    {
      title: "Complex Tabs",
      description: "顶部选项卡，用于切换复杂信息视图。",
      href: "/example-ui/complex-tabs",
      icon: Layers,
    },
  ];

  const layoutExamples = [
    {
      title: "移动端布局 (Mobile Layout)",
      description: "粘性头部、卡片列表、底部悬浮导航栏。",
      href: "/me",
      icon: Smartphone,
    },
    {
      title: "营销落地页 (Landing Page)",
      description: "响应式 Hero 区域、特性网格、页脚。",
      href: "/",
      icon: Monitor,
    },
    {
      title: "功能卡片 (Feature Cards)",
      description: "极简风格的卡片组件，用于列表展示。",
      href: "/dashboard",
      icon: CreditCard,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <h1 className="text-2xl font-bold mb-2">UI Examples</h1>
          <p className="text-muted-foreground">探索基于 Design System 构建的组件和页面范例。</p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            组件示例 (Components)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {componentExamples.map((example) => (
              <Link key={example.href} href={example.href}>
                <Card className="p-6 hover:shadow-md transition-all cursor-pointer border-border/50 group h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <example.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold group-hover:text-primary transition-colors">{example.title}</h2>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground">{example.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            页面布局 (Layouts)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {layoutExamples.map((example) => (
              <Link key={example.href} href={example.href}>
                <Card className="p-6 hover:shadow-md transition-all cursor-pointer border-border/50 group h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <example.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold group-hover:text-primary transition-colors">{example.title}</h2>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{example.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
