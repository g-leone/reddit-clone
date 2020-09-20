import { Box, IconButton, Link } from "@chakra-ui/core";
import NextLink from "next/link";
import React from "react";
import { useDeletePostMutation } from "../generated/graphql";

interface EditDeletePostButtonsProps {
  id: number;
}

const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
}) => {
  const [, deletePost] = useDeletePostMutation();

  return (
    <Box mb={6}>
      <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton
          as={Link}
          icon="edit"
          aria-label="edit post"
          size="sm"
          mr={4}
        />
      </NextLink>
      <IconButton
        icon="small-close"
        aria-label="delete post"
        onClick={() => {
          deletePost({ id });
        }}
        size="sm"
      />
    </Box>
  );
};

export default EditDeletePostButtons;
