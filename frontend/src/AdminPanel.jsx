import React, { useEffect, useState } from "react";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("new");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("https://geocode-na1k.onrender.com/api/employees/users");
    const data = await res.json();
    setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleVerify = async (userId) => {
    try {
      const res = await fetch(`https://geocode-na1k.onrender.com/api/employees/users/${userId}/verify`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed to verify");

      alert("User approved and moved to Verified tab.");

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, verify_email: true } : user
        )
      );
    } catch (err) {
      alert("Failed to verify user.");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`https://geocode-na1k.onrender.com/api/employees/users/${userId}`, {
        method: "DELETE",
      });
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  const filteredUsers =
    filter === "new"
      ? users.filter((u) => !u.verify_email)
      : users.filter((u) => u.verify_email);

  return (
    <div className="w-full overflow-x-auto min-h-screen bg-white p-4">
      <div className="min-w-[700px]">
        <h2 className="text-xl font-bold mb-4">Admin Panel – User List</h2>

        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${
              filter === "new" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setFilter("new")}
          >
            New Users
          </button>
          <button
            className={`px-4 py-2 rounded ${
              filter === "verified" ? "bg-green-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setFilter("verified")}
          >
            Verified Users
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredUsers.length === 0 ? (
          <p>No {filter === "new" ? "unverified" : "verified"} users found.</p>
        ) : (
          <table className="table-auto border text-sm w-full">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border p-2">Register Date</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Congregation</th>
                <th className="border p-2">Referral Source</th>
                {filter === "new" && <th className="border p-2">Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td className="border p-2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border p-2">{user.name}</td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">{user.congregation || "-"}</td>
                  <td className="border p-2">{user.referralSource || "-"}</td>
                  {filter === "new" && (
                    <td className="border p-2 flex gap-2">
                      <button
                        className="text-green-600 font-bold text-xl"
                        title="Approve"
                        onClick={() => handleVerify(user._id)}
                      >
                        ✔️
                      </button>
                      <button
                        className="text-red-600 font-bold text-xl"
                        title="Delete"
                        onClick={() => handleDelete(user._id)}
                      >
                        ❌
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
