import RoadtripPlanner from "@/components/roadtrip-planner";

export const metadata = {
  title: "Road Trip Planner | Afterglow",
  description: "Plan a road trip and discover ticketed events, zoos, water parks, and amusement parks along the way.",
};

export default function RoadtripPage() {
  return <div className="roadtrip-page"><RoadtripPlanner /></div>;
}
