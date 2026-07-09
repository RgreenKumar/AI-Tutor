import { useState } from "react";
import "./Profile.css";

function Profile() {
  const [user, setUser] = useState({
    name: "Sayaa",
    email: "sayaa@example.com",
    college: "",
    department: "",
    year: "",
  });

  const [image, setImage] = useState(null);

  function handleChange(e) {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  }

  function handleImage(e) {
    const file = e.target.files[0];

    if (file) {
      setImage(URL.createObjectURL(file));
    }
  }

  function saveProfile() {
    alert("Profile Updated Successfully!");
  }

  function logout() {
    alert("Logged Out");
  }

  return (
    <div className="profile-page">

      <div className="profile-card">

        <h1>My Profile</h1>

        <div className="profile-image">

          <img
            src={
              image ||
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            }
            alt="profile"
          />

          <label className="upload-photo">
            Change Photo

            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImage}
            />

          </label>

        </div>

        <div className="profile-form">

          <input
            name="name"
            placeholder="Name"
            value={user.name}
            onChange={handleChange}
          />

          <input
            name="email"
            placeholder="Email"
            value={user.email}
            onChange={handleChange}
          />

          <input
            name="college"
            placeholder="College"
            value={user.college}
            onChange={handleChange}
          />

          <input
            name="department"
            placeholder="Department"
            value={user.department}
            onChange={handleChange}
          />

          <input
            name="year"
            placeholder="Year"
            value={user.year}
            onChange={handleChange}
          />

          <button
            className="save-btn"
            onClick={saveProfile}
          >
            Save Changes
          </button>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </div>

    </div>
  );
}

export default Profile;