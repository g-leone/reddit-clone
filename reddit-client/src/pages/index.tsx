import React, { useState } from "react";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { PostsDocument, usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  IconButton,
  Link,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/core";
import NextLink from "next/link";
import { Upvote } from "../components/Upvote";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({ variables });
  if (!fetching && !data) {
    return <div>Unable to fetch posts</div>;
  }
  return (
    <Layout>
      <Flex align={"center"}>
        <Heading>Posts</Heading>
        <NextLink href="create-post">
          <Link ml={"auto"}>Create Post</Link>
        </NextLink>
      </Flex>

      <br />
      {!data && fetching ? (
        <Flex align={"center"}>
          <Spinner />
        </Flex>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) => (
            <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
              <Box>
                <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                  <Link>
                    <Heading fontSize="xl">{p.title}</Heading>
                  </Link>
                </NextLink>
                <Text>author: {p.author.username}</Text>
                <Text mt={4}>{p.textSnippet}</Text>
              </Box>
              <Upvote post={p} />
            </Flex>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMore && (
        <Flex>
          <Button
            onClick={() => {
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              });
            }}
            isLoading={fetching}
            variantColor="teal"
            m="auto"
            my={8}
          >
            Load More
          </Button>
        </Flex>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
