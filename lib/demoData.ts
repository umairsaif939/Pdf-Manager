export interface DemoDocument {
  id: string;
  name: string;
  pageCount: number;
  lastReadPage: number;
  size: string;
  lastOpened: string;
  folder: string;
  isFavorite: boolean;
  studyMinutes: number;
}

export const DEMO_DOCUMENTS: DemoDocument[] = [
  {
    id: "doc-neuro-101",
    name: "Principles of Cognitive Neuroscience.pdf",
    pageCount: 420,
    lastReadPage: 84,
    size: "18.4 MB",
    lastOpened: "Today, 10:15 AM",
    folder: "Neuroscience",
    isFavorite: true,
    studyMinutes: 145,
  },
  {
    id: "doc-stats-calc",
    name: "Bayesian Data Analysis - 3rd Edition.pdf",
    pageCount: 675,
    lastReadPage: 122,
    size: "24.2 MB",
    lastOpened: "Yesterday",
    folder: "Mathematics",
    isFavorite: true,
    studyMinutes: 210,
  },
  {
    id: "doc-hist-arch",
    name: "Mediterranean Classical Civilizations.pdf",
    pageCount: 310,
    lastReadPage: 45,
    size: "12.8 MB",
    lastOpened: "3 days ago",
    folder: "History",
    isFavorite: false,
    studyMinutes: 65,
  },
  {
    id: "doc-comp-arch",
    name: "Computer Systems: A Programmer's Perspective.pdf",
    pageCount: 1040,
    lastReadPage: 312,
    size: "38.5 MB",
    lastOpened: "5 days ago",
    folder: "Computer Science",
    isFavorite: true,
    studyMinutes: 340,
  },
];

export const DEMO_FOLDERS = [
  {
    id: "folder-neuro",
    name: "Neuroscience",
    docCount: 4,
    studyHours: "12.5 hrs",
    color: "#E76F35",
  },
  {
    id: "folder-math",
    name: "Mathematics",
    docCount: 3,
    studyHours: "8.2 hrs",
    color: "#24483D",
  },
  {
    id: "folder-history",
    name: "History",
    docCount: 2,
    studyHours: "3.4 hrs",
    color: "#9A6418",
  },
  {
    id: "folder-cs",
    name: "Computer Science",
    docCount: 5,
    studyHours: "18.0 hrs",
    color: "#347454",
  },
];
