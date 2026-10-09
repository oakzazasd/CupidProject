import {
  BookOpen,
  Camera,
  Cpu,
  Dumbbell,
  Film,
  Gamepad2,
  Music,
  Plane,
  UtensilsCrossed,
  Leaf,
  type LucideIcon,
} from "lucide-react";

export interface InterestCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  items: string[];
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: "music",
    label: "ดนตรี",
    icon: Music,
    items: ["K-pop", "J-pop", "Indie", "วงไทย", "คอนเสิร์ต", "เล่นดนตรี", "Lo-fi", "ฟังเพลงทั้งวัน"],
  },
  {
    id: "movies",
    label: "หนัง / ซีรีส์",
    icon: Film,
    items: ["Netflix", "ซีรีส์เกาหลี", "Marvel", "หนังผี", "หนังรัก", "หนัง Sci-fi", "มาราธอนซีรีส์"],
  },
  {
    id: "anime",
    label: "อนิเมะ / มังงะ",
    icon: BookOpen,
    items: ["One Piece", "Jujutsu Kaisen", "Spy x Family", "Ghibli", "อ่านมังงะ", "อนิเมะแนวสยอง", "รีวิวอนิเมะ"],
  },
  {
    id: "gaming",
    label: "เกม",
    icon: Gamepad2,
    items: ["Valorant", "LoL", "ROV", "Genshin", "Minecraft", "เกมอินดี้", "Elden Ring", "เกมมือถือ", "เกมสองคน"],
  },
  {
    id: "tech",
    label: "เทคโนโลยี",
    icon: Cpu,
    items: ["เขียนโค้ด", "แกดเจ็ต", "AI", "หูฟัง", "Mechanical keyboard", "ประกอบคอม", "ดูรีวิวเทค"],
  },
  {
    id: "food",
    label: "อาหาร / เครื่องดื่ม",
    icon: UtensilsCrossed,
    items: ["ชานม", "กาแฟ", "หมูกระทะ", "อาหารญี่ปุ่น", "ตำ", "บุฟเฟต์", "ของหวาน", "หาร้านอร่อย", "ทำอาหาร"],
  },
  {
    id: "travel",
    label: "ท่องเที่ยว",
    icon: Plane,
    items: ["ทะเล", "เขาใหญ่", "ญี่ปุ่น", "แคมป์ปิ้ง", "Road trip", "หาคาเฟ่", "เที่ยวต่างจังหวัด", "ดูวิวกลางคืน"],
  },
  {
    id: "art",
    label: "ศิลปะ / ถ่ายรูป",
    icon: Camera,
    items: ["ถ่ายรูป", "วาดรูป", "Film camera", "งาน craft", "แกลเลอรี", "ออกแบบ", "ดูนิทรรศการ"],
  },
  {
    id: "sports",
    label: "กีฬา",
    icon: Dumbbell,
    items: ["ฟิตเนส", "วิ่ง", "แบดมินตัน", "ปิงปอง", "ว่ายน้ำ", "ปั่นจักรยาน", "ฟุตบอล", "ปีนเขา", "โยคะ"],
  },
  {
    id: "lifestyle",
    label: "ไลฟ์สไตล์",
    icon: Leaf,
    items: ["แมว", "หมา", "อ่านหนังสือ", "คาเฟ่", "จดบันทึก", "ดู YouTube", "ปลูกต้นไม้", "เลี้ยงปลา", "มูฟวี่ไนท์"],
  },
];
