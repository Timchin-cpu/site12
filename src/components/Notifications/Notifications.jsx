import React, { useEffect, useState } from "react";
import styles from "./Notifications.module.css";
import { useNavigate } from "react-router-dom";

function Notifications() {
  const navigate = useNavigate();
  const userType = localStorage.getItem("userType");
  const [notifications, setNotifications] = useState([]);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [userId]);

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
        <h2>Уведомления</h2>
        <div className={styles.notificationsList}>
          {notifications.map((notification) => (
            <div key={notification.id} className={styles.notificationItem}>
              <p className={styles.timestamp}>
                {new Date(notification.created_at).toLocaleString()}
              </p>
              <p className={styles.message}>{notification.message_content}</p>
            </div>
          ))}
        </div>
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
    </div>
  );
}

export default Notifications;
