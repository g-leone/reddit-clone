import { Flex, IconButton } from "@chakra-ui/core";
import React, { useState } from "react";
import {
  PostSnippetFragment,
  PostsQuery,
  useVoteMutation,
} from "../generated/graphql";

interface UpvoteProps {
  post: PostSnippetFragment;
}

export const Upvote: React.FC<UpvoteProps> = ({ post }) => {
  const [, vote] = useVoteMutation();
  const [loadingState, setLoadingState] = useState<
    "upvote-loading" | "downvote-loading" | "not-loading"
  >("not-loading");
  return (
    <Flex ml={"auto"} justifyContent="center" direction="column" align="center">
      <IconButton
        aria-label="up vote"
        icon="chevron-up"
        variant="outline"
        isRound
        isLoading={loadingState === "upvote-loading"}
        variantColor={post.voteStatus === 1 ? "teal" : undefined}
        onClick={async () => {
          if (post.voteStatus === 1) {
            return;
          }
          setLoadingState("upvote-loading");
          await vote({
            postId: post.id,
            value: 1,
          });
          setLoadingState("not-loading");
        }}
      />
      {post.points}
      <IconButton
        variant="outline"
        aria-label="down vote"
        icon="chevron-down"
        isRound
        isLoading={loadingState === "downvote-loading"}
        variantColor={post.voteStatus === -1 ? "teal" : undefined}
        onClick={async () => {
          if (post.voteStatus === -1) {
            return;
          }
          setLoadingState("downvote-loading");
          vote({
            postId: post.id,
            value: -1,
          });
          setLoadingState("not-loading");
        }}
      />
    </Flex>
  );
};
