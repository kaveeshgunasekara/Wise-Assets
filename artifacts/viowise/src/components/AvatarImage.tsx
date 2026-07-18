interface AvatarImageProps {
  user?: { name?: string; avatar_url?: string } | null;
  className?: string;
}

export default function AvatarImage({ user, className = "w-10 h-10 text-lg" }: AvatarImageProps) {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name ? `${user.name}'s photo` : "User avatar"}
        className={`${className} rounded-full object-cover border border-primary/20`}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif border border-primary/20`}
    >
      {initial}
    </div>
  );
}
