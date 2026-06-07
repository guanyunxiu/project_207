export function maskName(name: string): string {
  if (!name) return '';
  if (name.length <= 1) return name;
  if (name.length === 2) return name.charAt(0) + '*';
  return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
}

export function maskPhone(phone: string): string {
  if (!phone) return '';
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function maskEmail(email: string): string {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  if (username.length <= 2) return username + '***@' + domain;
  return username.charAt(0) + '***' + username.charAt(username.length - 1) + '@' + domain;
}

export function maskIdCard(idCard: string): string {
  if (!idCard) return '';
  if (idCard.length < 8) return idCard;
  return idCard.slice(0, 6) + '********' + idCard.slice(-4);
}

export function anonymizeUser(user: any): any {
  if (!user) return user;
  return {
    ...user,
    username: user.username ? maskName(user.username) : user.username,
    nickname: user.nickname ? maskName(user.nickname) : user.nickname,
    phone: user.phone ? maskPhone(user.phone) : user.phone,
    email: user.email ? maskEmail(user.email) : user.email,
  };
}
