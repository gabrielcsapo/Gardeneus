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
        id: "yard-editor",
        path: "yard/:id",
        component: () => import("./routes/yard.$id.js"),
      },
      {
        id: "plants",
        path: "plants",
        component: () => import("./routes/plants.js"),
      },
      {
        id: "calendar",
        path: "calendar",
        component: () => import("./routes/calendar.js"),
      },
      {
        id: "log",
        path: "log",
        component: () => import("./routes/log.js"),
      },
      {
        id: "tasks",
        path: "tasks",
        component: () => import("./routes/tasks.js"),
      },
      {
        id: "pests",
        path: "pests",
        component: () => import("./routes/pests.js"),
      },
      {
        id: "seeds",
        path: "seeds",
        component: () => import("./routes/seeds.js"),
      },
      {
        id: "soil",
        path: "soil",
        component: () => import("./routes/soil.js"),
      },
      {
        id: "docs",
        path: "docs",
        component: () => import("./routes/docs.js"),
      },
      {
        id: "settings",
        path: "settings",
        component: () => import("./routes/settings.js"),
      },
    ],
  },
];
