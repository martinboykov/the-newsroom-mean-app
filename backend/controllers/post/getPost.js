const { Post } = require('../../models/post');

// GET
const getPosts = async (req, res, next) => {
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const currentPage = parseInt(req.query.page, 10) || 1;
  const postQuery = Post.find({ isVisible: true });
  if (pageSize && currentPage) {
    postQuery
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
  }
  const posts = await postQuery
    .select(
      '_id title content category subcategory dateCreated author imageMainPath')
    .sort({ 'dateCreated': -1 });

  posts.map((post) => {
    let content = post.content;
    content = content.substring(0, 1000);
    post.content = content;
    return post;
  });
  res.status(200).json({
    message: 'Posts fetched successfully',
    data: posts,
  });
};

const getPostsTotalCount = async (req, res, next) => {
  // const posts = await Post.find({ isVisible: true });
  // const postsCount = await Post.countDocuments();
  // const postsCount = posts.length;
  const posts = await Post.aggregate([
    { $match: { isVisible: true } },
    { $group: { _id: null, count: { $sum: 1 } } },
    { $project: { _id: 0 } },
  ]);
  let totalCount;
  if (posts[0]) totalCount = posts[0].count || 0;
  if (!posts[0]) totalCount = 0;
  res.status(200).json({
    message: 'Total posts count fetched successfully',
    data: totalCount,
  });
};

const getPost = async (req, res, next) => {
  const _id = req.params._id;
  const pageSize = parseInt(req.query.pageSize, 10);
  const currentPage = parseInt(req.query.page, 10);
  const post = await Post.findOne({ _id: _id });
  if (!post) return res.status(404).json({ message: 'No such post!' });
  const totalCommentsCount = post.comments.length;
  const postWithLastComments = await Post.populate(post,
    {
      path: 'comments',
      options: {
        sort: { dateCreated: -1 },
        skip: pageSize * (currentPage - 1),
        limit: pageSize,
      },
    });

  return res.status(200).json({
    message: `Post with _id: ${post._id} fetched successfully`,
    data: {
      post: postWithLastComments,
      totalCommentsCount: totalCommentsCount,
    },
  });
};

const getPostComments = async (req, res, next) => {
  const _id = req.params._id;
  const pageSize = parseInt(req.query.pageSize, 10);
  const currentPage = parseInt(req.query.page, 10);
  const post = await Post.findOne({ _id: _id });
  if (!post) return res.status(404).json({ message: 'No such post!' });

  const postPopulatedComments = await Post.populate(post,
    {
      path: 'comments',
      options: {
        sort: { dateCreated: -1 },
        skip: pageSize * (currentPage - 1),
        limit: pageSize,
      },
    });
  const comments = postPopulatedComments.comments;
  return res.status(200).json({
    message: `Comments for page: ${currentPage} of Post with _id:${post._id} fetched successfully`, // eslint-disable-line max-len
    data: comments,
  });
};

const getSearchedPosts = async (req, res, next) => {
  const searchString = req.params.searchQuery;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const currentPage = parseInt(req.query.page, 10) || 1;
  const postQuery = Post.find({
    $text: {
      $search: searchString,
    },
    isVisible: true,
  });
  if (pageSize && currentPage) {
    postQuery
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
  }
  const posts = await postQuery
    .select(
      '_id title content category subcategory dateCreated author imageMainPath')
    .sort({ 'dateCreated': -1 });
  posts.map((post) => {
    let content = post.content;
    // for eventual HTML post document
    // --------------------------------
    // const el = document.createElement('html');
    // el.innerHTML = content;
    // el.querySelector('.first-paragraph'); // Live NodeList of your anchor elements

    content = content.substring(0, 1000); // for now...
    post.content = content;
    return post;
  });
  res.status(200).json({
    message: 'Posts fetched successfully',
    data: posts,
  });
};

const getSearchedPostsTotalCount = async (req, res, next) => {
  const searchString = req.params.searchQuery;
  const postsAggregate = await Post.aggregate(
    [
      {
        $match: {
          $text: { $search: searchString },
          isVisible: true,
        },
      },
      {
        $count: 'document_count',
      },
    ]
  );
  if (!postsAggregate[0]) {
    return res.status(200).json({
      message: 'There are no posts with this searchquery',
      data: 0,
    });
  }
  const postCount = postsAggregate[0].document_count;

  return res.status(200).json({
    message: 'Total searched posts count fetched successfully',
    data: postCount,
  });
};

const getRelatedPosts = async (req, res, next) => {
  const _id = req.params._id;
  const post = await Post.findOne({
    _id: _id,
  });
  const tags = post.tags.reduce((accumulator, current) => {
    accumulator.push(current._id);
    return accumulator;
  }, []);
  const posts = await Post
    .find({ 'tags._id': [...tags], _id: { $ne: _id }, isVisible: true })
    .sort({ 'dateCreated': -1 })
    .limit(5)
    .select(
      '_id title category subcategory');
  return res.status(200).json({
    message:
      `Related posts for Post with _id: ${post._id} fetched successfully`,
    data: posts,
  });
};

const getLatestPosts = async (req, res, next) => {
  const dateNow = new Date();
  const daysInPast = 30; // should be 1 day before
  const posts = await Post
    .find({
      dateCreated: {
        $gte: new Date(dateNow.setDate(dateNow.getDate() - daysInPast)),
      },
      isVisible: true,
    })
    .limit(6)
    .sort({ 'dateCreated': -1 })
    .select(
      '_id title category subcategory dateCreated author imageMainPath');
  return res.status(200).json({
    message:
      `Latest Posts fetched successfully`,
    data: posts,
  });
};

const getPopularPosts = async (req, res, next) => {
  const dateNow = new Date();
  const daysInPast = 30; // should be 1 day before
  const posts = await Post
    .find({
      dateCreated: {
        $gte: new Date(dateNow.setDate(dateNow.getDate() - daysInPast)),
      },
      isVisible: true,
    })
    .sort({ 'popularity': -1 })
    .limit(6)
    .select(
      '_id title category subcategory dateCreated author imageMainPath popularity'); // eslint-disable-line max-len
  return res.status(200).json({
    message:
      `Latest Posts fetched successfully`,
    data: posts,
  });
};

const getComentedPosts = async (req, res, next) => {
  const dateNow = new Date();
  const daysInPast = 30; // should be 1 day before
  const posts = await Post.aggregate([
    {
      $match: {
        'dateCreated': {
          $gte: new Date(dateNow.setDate(dateNow.getDate() - daysInPast)),
        },
        'comments': {
          $exists: true, $not: { $size: 0 },
        },
        isVisible: true,
      },
    },
    {
      $addFields: {
        comments_count: { $size: { '$ifNull': ['$comments', []] } },
      },
    },
    {
      $sort: { 'comments_count': -1, dateCreated: -1 },
    },
    {
      $limit: 6,
    },

    {
      $project: {
        _id: 1,
        title: 1,
        author: 1,
        category: 1,
        subcategory: 1,
        dateCreated: 1,
        imageMainPath: 1,
        comments_count: 1,
      },
    },

  ]);

  return res.status(200).json({
    message:
      `Latest Posts fetched successfully`,
    data: posts,
  });
};

/* eslint-disable no-process-env*/
const getSlackWebHook = async (req, res, next) => {
  return res.status(200).json({
    message: 'Slack WebHook recieved',
    data: process.env.SLACK_WEBHOOK,
  });
};

module.exports = {
  getPosts,
  getPostsTotalCount,
  getSearchedPosts,
  getSearchedPostsTotalCount,
  getPost,
  getPostComments,
  getRelatedPosts,
  getLatestPosts,
  getPopularPosts,
  getComentedPosts,
  getSlackWebHook,
};
