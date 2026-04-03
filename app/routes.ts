import type { RouteConfig } from "react-flight-router/router";

export const routes: RouteConfig[] = [
  {
    id: "root",
    path: "",
    component: () => import("./root.js"),
    notFound: () => import("./routes/not-found.js"),
    children: [
      {
        id: "home",
        index: true,
        component: () => import("./routes/home.js"),
      },
      {
        id: "yards",
        path: "yard",
        component: () => import("./routes/yard.js"),
      },
      {
        id: "yard-detail",
        path: "yard/:id",
        component: () => import("./routes/yard.$id.js"),
        children: [
          {
            id: "yard-index",
            index: true,
            component: () => import("./routes/yard.$id.index.js"),
          },
          {
            id: "yard-plants",
            path: "plants",
            component: () => import("./routes/yard.$id.plants.js"),
          },
          {
            id: "yard-tasks",
            path: "tasks",
            component: () => import("./routes/yard.$id.tasks.js"),
          },
          {
            id: "yard-seeds",
            path: "seeds",
            component: () => import("./routes/yard.$id.seeds.js"),
          },
          {
            id: "yard-soil",
            path: "soil",
            component: () => import("./routes/yard.$id.soil.js"),
          },
          {
            id: "yard-pests",
            path: "pests",
            component: () => import("./routes/yard.$id.pests.js"),
          },
          {
            id: "yard-settings",
            path: "settings",
            component: () => import("./routes/yard.$id.settings.js"),
          },
        ],
      },
    ],
  },
];
