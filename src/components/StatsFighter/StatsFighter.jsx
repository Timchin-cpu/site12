import React, { useEffect, useState } from "react";
import styles from "./StatsFighter.module.css";
import { useNavigate, useLocation } from "react-router-dom";
function StatsFighter() {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showEditDonationModal, setShowEditDonationModal] = useState(false);
  const [editedDream, setEditedDream] = useState("");
  const [editedTarget, setEditedTarget] = useState("");
  const handleDonationClick = () => {
    setShowEditDonationModal(true);
  };
  const handleSaveDonation = async () => {
    try {
      const response = await fetch(
        `/api/fighter/donation/${fighterData.userData.fighter_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dream: editedDream,
            target: editedTarget,
          }),
        }
      );

      if (response.ok) {
        setDonationProgress({
          ...donationProgress,
          target: editedTarget,
        });
        fighterData.userData.dream = editedDream;
        fighterData.userData.donat = editedTarget;
        setShowEditDonationModal(false);
      }
    } catch (error) {
      console.error("Error updating donation:", error);
    }
  };
  const handleMessageButtonClick = async () => {
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: localStorage.getItem("userId"),
          receiverId: fighterData.userData.fighter_id,
          content: messageText,
          userType: userType,
        }),
      });

      if (response.ok) {
        setShowMessageModal(false);
        setMessageText(""); // очищаем поле после отправки
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  const navigate = useNavigate();
  const userType = localStorage.getItem("userType");
  // console.log(userType);
  const [commentLikes, setCommentLikes] = useState({});
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const { fighterData } = location.state || {};
  console.log(fighterData);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postContent, setPostContent] = useState("");
  const rotation = (fighterData.userData.rating / 100) * 180 - 90;
  const [commentReplies, setCommentReplies] = useState({});
  const [likedPosts, setLikedPosts] = useState({}); // Добавить состояние для отслеживания лайкнутых постов
  const [likedComments, setLikedComments] = useState({}); // Added state for comment likes
  const [messageText, setMessageText] = useState("");
  const [donationProgress, setDonationProgress] = useState({
    current: fighterData.userData.donat_now, // Current donation amount
    target: fighterData.userData.donat, // Target donation amount
  });
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCommentLikeStatuses = async () => {
      const statuses = {};
      for (const postId in comments) {
        for (const comment of comments[postId]) {
          try {
            const response = await fetch(
              `/api/comments/${comment.id}/likes/${localStorage.getItem(
                "userId"
              )}?userType=${userType}`
            );
            if (response.ok) {
              const data = await response.json();
              statuses[comment.id] = data.isLiked;
            }
          } catch (error) {
            console.error("Error fetching comment like status:", error);
          }
        }
      }
      setLikedComments(statuses);
    };

    if (Object.keys(comments).length > 0) {
      fetchCommentLikeStatuses();
    }
  }, [comments, userType]);

  const handleCommentLike = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: localStorage.getItem("userId"),
          userType: userType,
        }),
      });

      if (response.ok) {
        setLikedComments((prev) => ({
          ...prev,
          [commentId]: !prev[commentId],
        }));

        // Добавляем обновление количества лайков
        const newLikeCount = await fetchCommentLikes(commentId);
        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: newLikeCount,
        }));
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };
  async function fetchRepliesCount(commentId) {
    try {
      const response = await fetch(`/api/comments/${commentId}/repliesCount`);
      if (!response.ok) {
        throw new Error("Ошибка при получении количества ответов");
      }
      const data = await response.json();
      return data.repliesCount;
    } catch (error) {
      console.error("Ошибка:", error);
      return 0;
    }
  }
  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Добавить токен авторизации
        },
        body: JSON.stringify({
          userId: localStorage.getItem("userId"),
          userType: userType,
        }),
      });

      if (response.status === 403) {
        alert("У вас нет прав для удаления этого поста");
        return;
      }

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };
  const fetchPosts = async () => {
    try {
      const response = await fetch(
        `/api/posts/${fighterData.userData.fighter_id}`
      );
      if (response.ok) {
        const data = await response.json();
        const postsWithDetails = await Promise.all(
          data.map(async (post) => {
            const [totalLikes, comments, likeStatus] = await Promise.all([
              fetchTotalLikes(post.id),
              fetchComments(post.id),
              fetchLikeStatus(post.id),
            ]);
            return { ...post, totalLikes, comments, likeStatus };
          })
        );

        setPosts(postsWithDetails);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(
          `/api/posts/${fighterData.userData.fighter_id}`
        );
        if (response.ok) {
          const data = await response.json();
          const postsWithDetails = await Promise.all(
            data.map(async (post) => {
              const [totalLikes, comments, likeStatus] = await Promise.all([
                fetchTotalLikes(post.id),
                fetchComments(post.id),
                fetchLikeStatus(post.id),
              ]);
              return { ...post, totalLikes, comments, likeStatus };
            })
          );
          console.log(postsWithDetails);

          setPosts(postsWithDetails);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    fetchPosts();
  }, [fighterData.userData.fighter_id]);
  useEffect(() => {
    const loadCommentLikesAndReplies = async () => {
      for (const postId in comments) {
        const commentLikesPromises = comments[postId].map((comment) =>
          fetchCommentLikes(comment.id)
        );
        const likes = await Promise.all(commentLikesPromises);

        const repliesPromises = comments[postId].map((comment) =>
          fetchRepliesCount(comment.id)
        );
        const repliesCounts = await Promise.all(repliesPromises);

        const newCommentLikes = {};
        const newCommentReplies = {};

        comments[postId].forEach((comment, index) => {
          newCommentLikes[comment.id] = likes[index];
          newCommentReplies[comment.id] = repliesCounts[index];
        });

        setCommentLikes((prev) => ({ ...prev, ...newCommentLikes }));
        setCommentReplies((prev) => ({ ...prev, ...newCommentReplies }));
      }
    };

    if (Object.keys(comments).length > 0) {
      loadCommentLikesAndReplies();
    }
  }, [comments]);
  const fetchTotalLikes = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/likes`);
      if (response.ok) {
        const data = await response.json();
        // console.log(data);

        return data.totalLikes;
      }
    } catch (error) {
      console.error("Error fetching total likes:", error);
      return 0;
    }
  };
  useEffect(() => {
    const fetchLikeStatus = async (postId) => {
      try {
        const response = await fetch(
          `/api/posts/${postId}/likes/${localStorage.getItem(
            "userId"
          )}?userType=${localStorage.getItem("userType")}`
        );

        if (response.ok) {
          const data = await response.json();
          setLikedPosts((prev) => ({
            ...prev,
            [postId]: data.isLiked,
          }));
        }
      } catch (error) {
        console.error("Error fetching like status:", error);
      }
    };

    posts.forEach((post) => fetchLikeStatus(post.id));
  }, [posts]);

  const handleSubmitPost = async () => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: postContent,
          userId: localStorage.getItem("userId"),
          fighterId: fighterData.userData.fighter_id,
        }),
      });

      if (response.ok) {
        setShowPostForm(false);
        setPostContent("");
        // Обновить список постов
        fetchPosts();
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const fetchLikeStatus = async (postId) => {
    try {
      const response = await fetch(
        `/api/posts/${postId}/likes/${localStorage.getItem("userId")}`
      );
      if (response.ok) {
        const data = await response.json();
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, isLiked: data.isLiked } : post
          )
        );
      }
    } catch (error) {
      console.error("Error fetching like status:", error);
    }
  };
  const handlePostClick = (post) => {
    navigate(`/post/${post.id}`, {
      state: {
        post: post,
        fighterData: fighterData.userData,
        comments: comments[post.id],
      },
    });
  };
  const fetchComments = async (postId) => {
    try {
      const response = await fetch(`/api/comments/${postId}`);
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setComments((prev) => ({
          ...prev,
          [postId]: data,
        }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };
  const fetchCommentLikes = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/likes`);
      if (response.ok) {
        const data = await response.json();
        return data.totalLikes;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching comment likes:", error);
      return 0;
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: localStorage.getItem("userId"),
          userType: localStorage.getItem("userType"), // Добавляем userType
        }),
      });

      if (response.ok) {
        setLikedPosts((prev) => ({
          ...prev,
          [postId]: !prev[postId],
        }));
        const totalLikes = await fetchTotalLikes(postId);
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, totalLikes } : post
          )
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <div className={styles.backArrow}>
            <img src="arrow.png" alt="#" onClick={() => navigate(-1)} />
            <h1>BroDonate</h1>
          </div>
          <div className={styles.iconsContainer}>
            <img
              src="Notification.png"
              alt=""
              className={styles.notification}
              onClick={() => {
                navigate("/Notifications");
              }}
            />
            <img
              src="search.png"
              alt=""
              className={styles.search}
              onClick={() => navigate("/Saerch")}
            />
          </div>
        </div>
        <p className={styles.competitions}>Турниры·Профиль спортсмена</p>
        <div className={styles.contentAbout}>
          <div className={styles.contentAboutImg}>
            {/* <img
              src={`${fighterData.userData.photo_url}`}
              alt="#"
            /> */}
            <img
              src={
                fighterData.userData.photo_url
                  ? `${fighterData.userData.photo_url}`
                  : "Avatar.png"
              }
              alt="User Avatar"
              className={styles.profileImage}
            />
          </div>

          <div className={styles.nameFlag}>
            <h1>
              {fighterData.userData.name} {fighterData.userData.surname}
            </h1>
            <img src="flag.png" alt="#" />
          </div>
          <h2>{fighterData.userData.nick}</h2>
          <p className={styles.greyText}>
            {fighterData.userData.region}, {fighterData.userData.country}
          </p>
          <div className={styles.count}>
            <p className={styles.greyText}>
              {" "}
              {fighterData.userData.discipline}{" "}
            </p>
            <p className={styles.greyText}> {fighterData.userData.record} </p>
          </div>
          <div
            className={styles.donationProgressContainer}
            onClick={handleDonationClick}
          >
            <p>{fighterData.userData.dream}</p>
            <div className={styles.donationProgressBar}>
              <div
                className={styles.donationProgressFill}
                style={{
                  width: `${
                    (donationProgress.current / donationProgress.target) * 100
                  }%`,
                }}
              >
                <span className={styles.donationProgressPercentage}>
                  {Math.round(
                    (donationProgress.current / donationProgress.target) * 100
                  )}
                  %
                </span>
              </div>
            </div>
            <div className={styles.donationProgressText}>
              <span>{donationProgress.current.toLocaleString()} ₽</span>
              <span>{donationProgress.target.toLocaleString()} ₽</span>
            </div>
          </div>

          <button className={styles.inputButton} onClick={setShowMessageModal}>
            {fighterData.userData.msg || "Ввести сообщение"}
          </button>

          <div className={styles.donations}>
            <div>
              <p>Донаты</p>
              <p>562 000 ₽</p>
            </div>
            <div>
              <p>Благотворительность</p>
              <p>110 500 ₽</p>
            </div>
          </div>
          <div className={styles.gaugeContainer}>
            <img
              src="half-circle.png"
              alt="Полукруг"
              className={styles.halfCircle}
            />
            <img
              src="arrowqw.png"
              alt="Стрелка"
              className={styles.arrow}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            <div className={styles.percentage}></div>
          </div>
          <p className={styles.heroFans}>Герой фанатов</p>
          <div className={styles.approvalRating}>
            <img src="lucide_info_20.png" alt="#" />
            <p>Рейтинг одобрения</p>
            <p>{fighterData.userData.rating} %</p>
          </div>
        </div>
        <h3>Статистика</h3>
        <div className={styles.statistics}>
          <div className={styles.statistic}>
            <p>Место в рейтинге</p>
            <p>#714</p>
          </div>
          <div className={styles.statistic}>
            <p>Получено голосов</p>
            <p>72 465</p>
          </div>
        </div>
        <div className={styles.community}>
          <h3>Сообщество</h3>
          <h3>Донаты</h3>
        </div>
        <div className={styles.buttonsPopular}>
          <button className={styles.buttonAll}>Все</button>
          <button className={styles.buttonPopular}>
            <img src="mdi_fire_20.png" alt="#" />
            Популярно
          </button>
        </div>
        {!showPostForm ? (
          <button
            className={styles.addPost}
            onClick={() => setShowPostForm(true)}
          >
            <img src="Add_20.png" alt="#" />
            Добавить пост
          </button>
        ) : (
          <div className={styles.passwordInputContainer}>
            <input
              type="text"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Введите текст поста"
              className={styles.passwordinput}
            />
            <img
              src="iconoir_send.png"
              alt="#"
              className={styles.eyeoff}
              onClick={handleSubmitPost}
              style={{ cursor: "pointer", pointerEvents: "auto" }}
            />{" "}
          </div>
        )}

        {posts.map((post) => (
          <React.Fragment key={post.id}>
            {/* Пост */}
            <div className={styles.cardFighter}>
              <div
                className={styles.cardHeaders}
                onClick={() => handlePostClick(post)}
              >
                <div className={styles.cardHeader}>
                  <img
                    src={
                      fighterData.userData.photo_url
                        ? `${fighterData.userData.photo_url}`
                        : "Avatar.png"
                    }
                    alt="User Avatar"
                    className={styles.profileImage}
                  />
                  <div className={styles.userInfo}>
                    <p className={styles.userName}>
                      {fighterData.userData.name}
                    </p>
                    <p className={styles.timestamp}>
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <img
                  src="pepicons-pop_dots-y_20.png"
                  alt="Delete"
                  onClick={() => handleDeletePost(post.id)}
                  style={{ cursor: "pointer" }}
                  className={styles.optionsIcon}
                />
              </div>
              <p className={styles.message}>{post.content}</p>
              <div className={styles.cardFooter}>
                <img
                  src={
                    likedPosts[post.id]
                      ? "Active=Yes.png"
                      : "hand-thumbs-up_20.png"
                  }
                  alt=""
                  className={styles.likeIcon}
                  onClick={() => handleLike(post.id)}
                  style={{ cursor: "pointer" }}
                />
                {post.totalLikes > 0 && (
                  <p className={styles.likeCount}>{post.totalLikes}</p>
                )}
                <img
                  src="proicons_comment_20.png"
                  alt=""
                  className={styles.commentIcon}
                />
                {comments[post.id]?.length > 0 && (
                  <p className={styles.likeCount}>{comments[post.id].length}</p>
                )}
              </div>
            </div>

            {/* Комментарии */}
            {comments[post.id]?.slice(0, 2).map((comment) => (
              <div key={comment.id} className={styles.commentCard}>
                <div className={styles.cardHeaders}>
                  <div className={styles.cardHeader}>
                    <img
                      onClick={console.log(comment)}
                      src={
                        comment.photo_url
                          ? `${comment.photo_url}`
                          : "Avatar.png"
                      }
                      alt="User Avatar"
                      className={styles.profileImage}
                    />
                    <div className={styles.userInfo}>
                      <p className={styles.userName}>{comment.user_name}</p>
                      <p className={styles.timestamp}>
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <p className={styles.message}>{comment.content}</p>
                <div className={styles.cardFooter}>
                  <img
                    src={
                      likedComments[comment.id]
                        ? "Active=Yes.png"
                        : "hand-thumbs-up_20.png"
                    }
                    alt=""
                    className={styles.likeIcon}
                    onClick={() => handleCommentLike(comment.id)}
                  />
                  {commentLikes[comment.id] > 0 && (
                    <p className={styles.likeCount}>
                      {commentLikes[comment.id]}
                    </p>
                  )}
                  <div className={styles.cardFooter}>
                    <img
                      src="proicons_comment_20.png"
                      alt=""
                      className={styles.commentIcon}
                    />
                    {commentReplies[comment.id] > 0 && (
                      <p className={styles.likeCount}>
                        {commentReplies[comment.id]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className={styles.bottomNav}>
        <div
          className={styles.catalogItem}
          onClick={() => {
            navigate("/main");
          }}
        >
          <img
            src="ui-checks-grid.png"
            alt=""
            className={styles.catalogImage}
          />
          <p className={styles.catalogText}>Каталог</p>
        </div>
        <div
          className={styles.catalogItem}
          onClick={() => {
            navigate("/alltournaments");
          }}
        >
          <img
            src="lightning-charge.png"
            alt=""
            className={styles.catalogImage}
          />
          <p className={styles.catalogText}>Турниры</p>
        </div>
        <div
          className={styles.catalogItem}
          onClick={() => {
            navigate("/Referal");
          }}
        >
          <img src="gift.png" alt="" className={styles.catalogImage} />
          <p className={styles.catalogText}>Рефералы</p>
        </div>
        <div
          className={styles.catalogItem}
          onClick={() => {
            if (userType === "fan") {
              navigate("/profileuser");
            } else {
              navigate("/profilefighter");
            }
          }}
        >
          <img src="person.png" alt="" className={styles.catalogImage} />
          <p className={styles.catalogText}>Профиль</p>
        </div>
      </div>
      {showMessageModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.topModalHead}>
              <div>
                <h2>Введите сообщение</h2>
                <img
                  src="x-circle.png"
                  alt="#"
                  onClick={() => setShowMessageModal(false)}
                />
              </div>
            </div>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Введите сообщение"
              className={styles.passwordinput}
            />
            <button
              onClick={() => {
                // Логика сохранения сообщения
                handleMessageButtonClick();
              }}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
      {showEditDonationModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.topModalHead}>
              <div>
                <h2>Цель по донатам</h2>
                <img
                  src="x-circle.png"
                  alt="#"
                  onClick={() => setShowEditDonationModal(false)}
                />
              </div>
            </div>
            <p>Введите текст цели</p>
            <input
              type="text"
              value={editedDream}
              onChange={(e) => setEditedDream(e.target.value)}
              placeholder="Введите цель"
            />
            <p>Введите желаемую цель</p>
            <input
              type="text"
              value={editedTarget}
              onChange={(e) => setEditedTarget(Number(e.target.value))}
              placeholder="Введите сумму"
            />
            <button onClick={handleSaveDonation}>Сохранить</button>
            {/* <button onClick={() => setShowEditDonationModal(false)}>
              Отмена
            </button> */}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsFighter;
