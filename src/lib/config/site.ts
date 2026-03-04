import { getPublicUrl } from "@/lib/utils";

export const siteConfig = {
  name: "社区财务系统",
  description: "面向社区场景的财务申请、审批与统计系统",
  tagline: "社区财务记录与审核平台",
  apiBase: getPublicUrl(),
  features: [
    {
      title: "财务申请流程",
      description: "支持收入登记与支出申请，统一记录与追踪审批状态",
    },
    {
      title: "审核与统计",
      description: "管理员可集中审核申请并查看收入、支出、余额等统计指标",
    },
    {
      title: "多端可用",
      description: "桌面端与移动端均可使用，便于社区成员随时提交与查询",
    },
  ],
  links: {
    signup: "/sign-up",
    signin: "/sign-in",
    finance: "/finance",
  },
};
