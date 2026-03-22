import { auth } from "@/lib/auth";
import { SignOut } from "@/components/signout";
import Link from "next/link";

const Navsignin = async () => {
  const session = await auth();

  if (!session) {
    return (
      <li>
        <a href="/signin" className="btn btn-primary btn-sm">
          Login
        </a>
      </li>
    );
  }

  const role = session.user?.role;
  const isAdmin = role === "ADMIN";
  const isModerator = role === "MODERATOR";
  const initial = (session.user?.name ?? session.user?.email ?? "U")[0].toUpperCase();

  return (
    <li className="list-none">
      <div className="dropdown dropdown-end">
        {/* Trigger button */}
        <button
          tabIndex={0}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-base-200 transition-colors cursor-pointer"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold shrink-0">
            {initial}
          </div>

          {/* Name + role — hidden on very small screens */}
          <div className="hidden sm:flex flex-col items-start leading-tight min-w-0">
            <span className="text-sm font-medium truncate max-w-[120px]">
              {session.user?.name}
            </span>
            {(isAdmin || isModerator) && (
              <span
                className={`text-xs font-semibold ${
                  isAdmin ? "text-red-500" : "text-orange-500"
                }`}
              >
                {isAdmin ? "Admin" : "Moderator"}
              </span>
            )}
          </div>

          {/* Chevron */}
          <svg
            className="w-3 h-3 text-base-content/40 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown panel */}
        <ul
          tabIndex={0}
          className="dropdown-content bg-base-100 rounded-xl z-50 w-56 p-1.5 shadow-lg border border-base-200 mt-1"
        >
          {/* User identity header */}
          <li className="px-3 py-2.5 mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold shrink-0">
                {initial}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-sm font-semibold truncate">
                  {session.user?.name}
                </p>
                {isAdmin || isModerator ? (
                  <span
                    className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${
                      isAdmin
                        ? "bg-red-100 text-red-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {isAdmin ? "Admin" : "Moderator"}
                  </span>
                ) : (
                  <p className="text-xs text-base-content/50 truncate">
                    {session.user?.email}
                  </p>
                )}
              </div>
            </div>
          </li>

          <div className="border-t border-base-200 my-1" />

          {/* Change password */}
          <li>
            <Link
              href="/account"
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-base-200 transition-colors"
            >
              <svg
                className="w-4 h-4 text-base-content/60 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
              Ubah Password
            </Link>
          </li>

          {/* Admin / Moderator panel link */}
          {(isAdmin || isModerator) && (
            <li>
              <Link
                href="/admin"
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-base-200 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-base-content/60 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
                Panel Admin
              </Link>
            </li>
          )}

          <div className="border-t border-base-200 my-1" />

          {/* Sign out */}
          <li>
            <SignOut />
          </li>
        </ul>
      </div>
    </li>
  );
};

export default Navsignin;
