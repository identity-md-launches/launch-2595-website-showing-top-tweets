export type Topic = "Builders" | "Ecosystem" | "Culture";
export interface Post {
  id: string;
  name: string;
  author: string;
  avatar: string;
  topic: Topic;
  quote: string;
  excerpt: boolean;
  url: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
}
export const snapshotDate = "Oct 26, 2026";
export const posts: Post[] = [
  {
    id: "2107161714718331326",
    name: "Adam",
    author: "surfcoderepeat",
    avatar: "surfcoderepeat.webp",
    topic: "Ecosystem",
    quote:
      "build on top of, and pair with and get a ball of energy to your project",
    excerpt: false,
    url: "https://x.com/surfcoderepeat/status/2107161714718331326",
    createdAt: "2026-10-05T17:31:16+00:00",
    likes: 218,
    retweets: 20,
    replies: 35,
    views: 24036,
  },
  {
    id: "2109100990028722657",
    name: "taylor",
    author: "taylor_",
    avatar: "taylor_.webp",
    topic: "Builders",
    quote:
      "just launched:\n\ndesign your $imd machine\n\npick the parts, stamp your initials, embed it anywhere. the art lives forever on ethereum",
    excerpt: true,
    url: "https://x.com/taylor_/status/2109100990028722657",
    createdAt: "2026-10-11T01:57:15+00:00",
    likes: 168,
    retweets: 24,
    replies: 20,
    views: 14177,
  },
  {
    id: "2111926070052036690",
    name: "taylor",
    author: "taylor_",
    avatar: "taylor_.webp",
    topic: "Builders",
    quote:
      "a mac app that puts your imd agents in your menu bar. see what each one is working on and what it earned",
    excerpt: true,
    url: "https://x.com/taylor_/status/2111926070052036690",
    createdAt: "2026-10-18T21:03:07+00:00",
    likes: 146,
    retweets: 17,
    replies: 26,
    views: 11286,
  },
  {
    id: "2109227941888409656",
    name: "Kalle Grabowski (His Dudeness)",
    author: "cryptokarlheinz",
    avatar: "cryptokarlheinz.webp",
    topic: "Culture",
    quote:
      "my imd agent just got payed for some audit work it did\n\nfeels good man",
    excerpt: false,
    url: "https://x.com/cryptokarlheinz/status/2109227941888409656",
    createdAt: "2026-10-11T10:21:43+00:00",
    likes: 143,
    retweets: 18,
    replies: 23,
    views: 15616,
  },
  {
    id: "2114414720283484578",
    name: "Adam",
    author: "surfcoderepeat",
    avatar: "surfcoderepeat.webp",
    topic: "Ecosystem",
    quote:
      "IMD based Project that plays music based on swaps on a univ4 hook now live 24/7 on twitter",
    excerpt: false,
    url: "https://x.com/surfcoderepeat/status/2114414720283484578",
    createdAt: "2026-10-25T17:52:07+00:00",
    likes: 136,
    retweets: 19,
    replies: 16,
    views: 7171,
  },
  {
    id: "2095221759439962123",
    name: "LastToSign",
    author: "LastToSign",
    avatar: "LastToSign.webp",
    topic: "Ecosystem",
    quote:
      "IdentityMD is building a system where AI creates products, NFTs identify participants in the contributor network",
    excerpt: true,
    url: "https://x.com/LastToSign/status/2095221759439962123",
    createdAt: "2026-09-02T18:46:09+00:00",
    likes: 111,
    retweets: 22,
    replies: 14,
    views: 32896,
  },
  {
    id: "2110773844135039185",
    name: "nagato",
    author: "nagato0x",
    avatar: "nagato0x.webp",
    topic: "Culture",
    quote: "Identity.md | $IMD",
    excerpt: false,
    url: "https://x.com/nagato0x/status/2110773844135039185",
    createdAt: "2026-10-15T16:44:35+00:00",
    likes: 48,
    retweets: 6,
    replies: 1,
    views: 769,
  },
  {
    id: "2114421090651156631",
    name: "bad friend",
    author: "badfriend",
    avatar: "badfriend.webp",
    topic: "Builders",
    quote:
      "now it has grown into a full music production line with 10 genres and dozens of styles created by the IMD swarm",
    excerpt: true,
    url: "https://x.com/badfriend/status/2114421090651156631",
    createdAt: "2026-10-25T18:17:26+00:00",
    likes: 39,
    retweets: 7,
    replies: 2,
    views: 1455,
  },
  {
    id: "2113571055621324927",
    name: "Karrisweet",
    author: "gotchiman44",
    avatar: "gotchiman44.webp",
    topic: "Builders",
    quote:
      "i use ai agents for crypto stuff daily (imd swarm). best tip: small jobs, check each step, never let it run blind",
    excerpt: true,
    url: "https://x.com/gotchiman44/status/2113571055621324927",
    createdAt: "2026-10-23T09:59:42+00:00",
    likes: 3,
    retweets: 0,
    replies: 2,
    views: 77,
  },
  {
    id: "2109857662791798856",
    name: "Adam",
    author: "surfcoderepeat",
    avatar: "surfcoderepeat.webp",
    topic: "Ecosystem",
    quote:
      "we are searching for weird ppl, artists, and ppl that want to mix smart contracts in weird ways",
    excerpt: true,
    url: "https://x.com/surfcoderepeat/status/2109857662791798856",
    createdAt: "2026-10-13T04:04:00+00:00",
    likes: 103,
    retweets: 11,
    replies: 8,
    views: 5985,
  },
];
