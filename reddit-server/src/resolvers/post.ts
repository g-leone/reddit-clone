import { Post } from "../entities/Post";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Upvote } from "../entities/UpVote";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 100) + (root.text.length > 100 ? "..." : "");
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    const isUpvote = value !== -1;
    const _value = isUpvote ? 1 : -1;
    const { userId } = req.session;

    const upVote = await Upvote.findOne({ where: { postId, userId } });

    if (upVote && upVote.value !== _value) {
      // user has voted on post before
      // user is changing vote
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
            update upvote
            set value = $1
            where "postId" = $2 and "userId" = $3
          `,
          [_value, postId, userId]
        );

        await tm.query(
          `
            update post
            set points = points + $1
            where id = $2
          `,
          [2 * _value, postId]
          // take away and also add point
        );
      });
    } else if (!upVote) {
      // never voted before
      console.log("SECOND ONE!!!!");
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
          insert into upvote ("userId", "postId", "value")
          values($1, $2, $3)
        `,
          [userId, postId, _value]
        );

        await tm.query(
          `
            update post
            set points = points + $1
            where id = $2
          `,
          [userId, postId]
        );
      });
    }
    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.max(5, limit);
    const replacements: any[] = [realLimit + 1];

    if (req.session.userId) {
      replacements.push(req.session.userId);
    }

    let cursorIndex = 3;
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIndex = replacements.length;
    }
    const posts = await getConnection().query(
      `
      select p.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email,
        'createdAt', u."createdAt",
        'updatedAt', u."updatedAt"
      ) author,
      ${
        req.session.userId
          ? `(select value from upvote where "userId" = $2 and "postId" = p.id) "voteStatus"`
          : `null as "voteStatus"`
      }
      from post p
      inner join public.user u on u.id = p."authorId"
      ${cursor ? `where p."createdAt" < $${cursorIndex}` : ``}
      order by p."createdAt" DESC
      limit $1
    `,
      replacements
    );

    return {
      hasMore: posts.length !== realLimit,
      posts: posts.slice(0, realLimit),
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id, { relations: ["author"] });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input", () => PostInput) input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      authorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String) title: string
  ): Promise<Post | undefined> {
    const post = await Post.findOne({ id });
    if (post) {
      if (typeof title !== "undefined") {
        post.title = title;
        Post.update({ id }, { title });
      }
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id", () => Int) id: number): Promise<boolean> {
    await Post.delete(id);
    return true;
  }
}
