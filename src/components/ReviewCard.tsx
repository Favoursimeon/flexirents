import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import RatingStars from "./RatingStars";
import { formatDistanceToNow } from "date-fns";
import { Edit, Trash2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ReviewCardProps {
  reviewId: string;
  reviewerName: string;
  reviewerUserId: string;
  rating: number;
  reviewText?: string;
  createdAt: string;
  currentUserId?: string;
  onEdit?: (reviewId: string, rating: number, reviewText?: string) => void;
  onDelete?: (reviewId: string) => void;
}

const ReviewCard = ({ 
  reviewId,
  reviewerName, 
  reviewerUserId,
  rating, 
  reviewText, 
  createdAt,
  currentUserId,
  onEdit,
  onDelete
}: ReviewCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [unhelpfulCount, setUnhelpfulCount] = useState(0);
  const [userVote, setUserVote] = useState<'helpful' | 'unhelpful' | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwnReview = currentUserId === reviewerUserId;

  const loadVotes = async () => {
    try {
      const { data: votes } = await api.get<{ vote_type: 'helpful' | 'unhelpful'; user_id: string }[]>(`/api/reviews/${reviewId}/votes`);

      const helpful = votes?.filter((v) => v.vote_type === 'helpful').length || 0;
      const unhelpful = votes?.filter((v) => v.vote_type === 'unhelpful').length || 0;

      setHelpfulCount(helpful);
      setUnhelpfulCount(unhelpful);

      if (user) {
        const userVoteData = votes?.find((v) => v.user_id === user.id);
        setUserVote(userVoteData?.vote_type || null);
      }
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  };

  useEffect(() => {
    loadVotes();
  }, [reviewId, user]);

  const handleVote = async (voteType: 'helpful' | 'unhelpful') => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote on reviews.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (userVote === voteType) {
        await api.delete(`/api/reviews/${reviewId}/votes`, {
          params: { user_id: user.id },
        });
        setUserVote(null);
      } else if (userVote) {
        await api.put(`/api/reviews/${reviewId}/votes`, {
          user_id: user.id,
          vote_type: voteType,
        });
        setUserVote(voteType);
      } else {
        await api.post(`/api/reviews/${reviewId}/votes`, {
          review_id: reviewId,
          user_id: user.id,
          vote_type: voteType,
        });
        setUserVote(voteType);
      }

      await loadVotes();
    } catch (error: any) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    onDelete?.(reviewId);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold">{reviewerName}</h4>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RatingStars rating={rating} showNumber={false} />
              {isOwnReview && (
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit?.(reviewId, rating, reviewText)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          {reviewText && (
            <p className="text-sm text-muted-foreground mt-2 mb-3">{reviewText}</p>
          )}
          
          {/* Voting buttons */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant={userVote === 'helpful' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 gap-1"
                onClick={() => handleVote('helpful')}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs">{helpfulCount}</span>
              </Button>
              <Button
                variant={userVote === 'unhelpful' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 gap-1"
                onClick={() => handleVote('unhelpful')}
              >
                <ThumbsDown className="h-4 w-4" />
                <span className="text-xs">{unhelpfulCount}</span>
              </Button>
            </div>
            {(helpfulCount > 0 || unhelpfulCount > 0) && (
              <span className="text-xs text-muted-foreground">
                {helpfulCount + unhelpfulCount} {helpfulCount + unhelpfulCount === 1 ? 'person found' : 'people found'} this review helpful
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReviewCard;