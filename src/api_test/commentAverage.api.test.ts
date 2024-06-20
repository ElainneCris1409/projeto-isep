import { Logger } from "tslog";
import ConfigHandler from "./config/configHandler";
import Users from "./endpoints/Users";
import Posts from "./endpoints/Posts";
import Comment from "./endpoints/Comments";
import UsersDataBase from "../database/users.database";
import PostDataBase from "../database/posts.database";
import moment from "moment";

const config = ConfigHandler.getInstance();
const log = new Logger({
  minLevel: config.environmnetConfig.log_level,
  dateTimeTimezone:
    config.environmnetConfig.time_zone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone,
});

let postsAPI: Posts;
let commentAPI: Comment;
let usersAPI: Users;
let accessToken: string;
let posts: { title: string; type: string; content: string }[];
let comments: string[];
let userLogin: { username: string; password: string; email: string };

/**
 * Teste de API para o endpoint /comment(average)
 */
describe("Create a post", () => {
  beforeAll(async () => {
    postsAPI = new Posts();
    usersAPI = new Users();
    commentAPI = new Comment();

    userLogin = {
      username: "crapi1234",
      password: "cristina1234",
      email: "cristinaapitest@gmail.com",
    };
    // Create a user
    await usersAPI.post(
      userLogin.username,
      userLogin.email,
      userLogin.password
    );

    posts = [
      {
        title: "Post 01 - Average Comments",
        type: "text",
        content: "Post 01 - Average Comments",
      },
      {
        title: "Post 02 - Average Comments",
        type: "text",
        content: "Post 02 - Average Comments",
      },
      {
        title: "Post 03 - Average Comments",
        type: "text",
        content: "Post 03 - Average Comments",
      },
    ];

    comments = [
      "Comment 01 - Average Comments",
      "Comment 02 - Average Comments",
      "Comment 03 - Average Comments",
    ];
  });

  /**
   * Faz login do usuário e obtém o token de acesso
   */
    it("Login", async () => {
    const response = await usersAPI.postLogin(
      userLogin.username,
      userLogin.password
    );
    expect(response.status).toBe(200);
    expect(response.data.accessToken).toBeDefined();
    expect(response.data.refreshToken).toBeDefined();
    accessToken = response.data.accessToken;
  });

    describe("Average Comments per Day Tests", () => {
    it("Get Average Comments Round UP when the results is with decimal points", async () => {
      
      // Clear all posts to assurence the average calculation
      let responseDeleteAll = await PostDataBase.deleteAllPosts();
      expect(responseDeleteAll).toBeDefined();

      // Creat 3 posts with 2 comments in total to emulate 1,5 average comments
      // Create first post
      let responsePost = await postsAPI.createPost(
        accessToken,
        posts[0].title,
        posts[0].type,
        posts[0].content
      );
      expect(responsePost.status).toBe(200);

      // Create second post
      responsePost = await postsAPI.createPost(
        accessToken,
        posts[1].title,
        posts[1].type,
        posts[1].content
      );
      expect(responsePost.status).toBe(200);

      // Create third post
      responsePost = await postsAPI.createPost(
        accessToken,
        posts[2].title,
        posts[2].type,
        posts[2].content
      );
      expect(responsePost.status).toBe(200);

      //    Get user base and member ID on DATABASE
      let dataUser = await UsersDataBase.getMemberIDsByEmail(userLogin.email);
      expect(dataUser[0]).toBeDefined();

      //   Destruct memberID from the response
      let { member_id } = dataUser[0];

      // Is necessary get the slug in database because the create post response doesn't return the slug
      let responseSelectSlug = await PostDataBase.selectPostSlug({
        member_id,
        title: posts[0].title,
      });
      expect(responseSelectSlug[0]).toBeDefined();

      let slugFirstPost = responseSelectSlug[0].slug;

      // Create a comment for the first post
      let responseComment = await commentAPI.createComment(
        accessToken,
        slugFirstPost,
        comments[0]
      );
      expect(responseComment.status).toBe(200);

      // Create a comment for the second post
      responseComment = await commentAPI.createComment(
        accessToken,
        slugFirstPost,
        comments[1]
      );

      // Get today date and transform on the format to the database
      // We use today date because the posts are created today and we clear all posts before each test to avoid conflicts
      const specificDate = moment().format("YYYY-MM-DD"); // Data para teste
      const response = await commentAPI.getAverageComment(
        accessToken,
        specificDate
      );
      expect(response.status).toBe(200);
      expect(response.data.average).toBeDefined();
      expect(response.data.average).toBe(`2.0000`);
    });

    it("Valid the average result with multiple posts and comments in the specifc date", async () => {
      
      // Clear all posts to assurence the average calculation
      let responseDeleteAll = await PostDataBase.deleteAllPosts();
      expect(responseDeleteAll).toBeDefined();

      // Creat 3 posts with 3 comments each to emulate 3 average comments
      // Create first post
      let responsePost = await postsAPI.createPost(
        accessToken,
        posts[0].title,
        posts[0].type,
        posts[0].content
      );
      expect(responsePost.status).toBe(200);

      // Create second post
      responsePost = await postsAPI.createPost(
        accessToken,
        posts[1].title,
        posts[1].type,
        posts[1].content
      );
      expect(responsePost.status).toBe(200);

      // Create third post
      responsePost = await postsAPI.createPost(
        accessToken,
        posts[2].title,
        posts[2].type,
        posts[2].content
      );
      expect(responsePost.status).toBe(200);

      //    Get user base and member ID on DATABASE
      let dataUser = await UsersDataBase.getMemberIDsByEmail(userLogin.email);
      expect(dataUser[0]).toBeDefined();

      //   Destruct memberID from the response
      let { member_id } = dataUser[0];

      // Is necessary get the slug in database because the create post response doesn't return the slug
      let responseSelectSlug = await PostDataBase.selectPostSlug({
        member_id,
        title: posts[0].title,
      });
      expect(responseSelectSlug[0]).toBeDefined();

      let slugFirstPost = responseSelectSlug[0].slug;

      // Create first comment for the first post
      let responseComment = await commentAPI.createComment(
        accessToken,
        slugFirstPost,
        comments[0]
      );
      expect(responseComment.status).toBe(200);

      // Create second comment for the first post
      responseComment = await commentAPI.createComment(
        accessToken,
        slugFirstPost,
        comments[1]
      );
      expect(responseComment.status).toBe(200);

      // Create third comment for the first post
      responseComment = await commentAPI.createComment(
        accessToken,
        slugFirstPost,
        comments[2]
      );
      expect(responseComment.status).toBe(200);

      // Is necessary get the slug in database because the create post response doesn't return the slug
      responseSelectSlug = await PostDataBase.selectPostSlug({
        member_id,
        title: posts[1].title, // Second post
      });
      expect(responseSelectSlug[0]).toBeDefined();

      let slugSecondPost = responseSelectSlug[0].slug;

      // Create first comment for the second post
      responseComment = await commentAPI.createComment(
        accessToken,
        slugSecondPost,
        comments[0]
      );
      expect(responseComment.status).toBe(200);

      // Create second comment for the second post
      responseComment = await commentAPI.createComment(
        accessToken,
        slugSecondPost,
        comments[1]
      );
      expect(responseComment.status).toBe(200);

      // Create third comment for the second post
      responseComment = await commentAPI.createComment(
        accessToken,
        slugSecondPost,
        comments[2]
      );
      expect(responseComment.status).toBe(200);
      
      // Is necessary get the slug in database because the create post response doesn't return the slug
      responseSelectSlug = await PostDataBase.selectPostSlug({
        member_id,
        title: posts[2].title, // Third post
      });
      expect(responseSelectSlug[0]).toBeDefined();

      let slugThird = responseSelectSlug[0].slug;

      // Create first comment for the third post
      responseComment = await commentAPI.createComment(
        accessToken,
        slugThird,
        comments[0]
      );
      expect(responseComment.status).toBe(200);

      // Create second comment for the third post
      responseComment = await commentAPI.createComment(
        accessToken,
        slugThird,
        comments[1]
      );
      expect(responseComment.status).toBe(200);

      // Create third comment for the third post
      responseComment = await commentAPI.createComment(
        accessToken,
        slugThird,
        comments[2]
      );
      expect(responseComment.status).toBe(200);

      // Get today date and transform on the format to the database
      // We use today date because the posts are created today and we clear all posts before each test to avoid conflicts
      const specificDate = moment().format("YYYY-MM-DD"); // Data para teste
      const response = await commentAPI.getAverageComment(
        accessToken,
        specificDate
      );
      expect(response.status).toBe(200);
      expect(response.data.average).toBeDefined();
      expect(response.data.average).toBe('9.0000');
    });

  });
});
