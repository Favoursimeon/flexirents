import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showNumber?: boolean;
}

const RatingStars = ({ rating, maxRating = 5, size = 16, showNumber = true }: RatingStarsProps) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxRating)].map((_, index) => {
        if (index < fullStars) {
          return (
            <Star
              key={index}
              size={size}
              className="fill-yellow-400 text-yellow-400"
            />
          );
        } else if (index === fullStars && hasHalfStar) {
          return (
            <div key={index} className="relative">
              <Star size={size} className="text-gray-300" />
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star size={size} className="fill-yellow-400 text-yellow-400" />
              </div>
            </div>
          );
        } else {
          return <Star key={index} size={size} className="text-gray-300" />;
        }
      })}
      {showNumber && (
        <span className="text-sm font-medium ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;