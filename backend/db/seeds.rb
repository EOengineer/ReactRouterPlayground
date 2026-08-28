# frozen_string_literal: true

users = [
  {
    email: "eoengineer@gmail.com",
    first_name: "Eric",
    last_name: "Oligney",
    password: "password1234!",
    admin: true
  },
  {
    email: "alex.rivera@example.com",
    first_name: "Alex",
    last_name: "Rivera",
    password: "password1234!",
    admin: false
  },
  {
    email: "jordan.lee@example.com",
    first_name: "Jordan",
    last_name: "Lee",
    password: "password1234!",
    admin: false
  },
  {
    email: "sam.patel@example.com",
    first_name: "Sam",
    last_name: "Patel",
    password: "password1234!",
    admin: false
  },
  {
    email: "casey.nguyen@example.com",
    first_name: "Casey",
    last_name: "Nguyen",
    password: "password1234!",
    admin: false
  },
  {
    email: "morgan.brooks@example.com",
    first_name: "Morgan",
    last_name: "Brooks",
    password: "password1234!",
    admin: false
  },
  {
    email: "taylor.kim@example.com",
    first_name: "Taylor",
    last_name: "Kim",
    password: "password1234!",
    admin: false
  },
  {
    email: "riley.garcia@example.com",
    first_name: "Riley",
    last_name: "Garcia",
    password: "password1234!",
    admin: false
  },
  {
    email: "jamie.foster@example.com",
    first_name: "Jamie",
    last_name: "Foster",
    password: "password1234!",
    admin: false
  },
  {
    email: "avery.chen@example.com",
    first_name: "Avery",
    last_name: "Chen",
    password: "password1234!",
    admin: false
  }
]

users.each do |attrs|
  User.find_or_create_by!(email: attrs[:email]) do |user|
    user.first_name = attrs[:first_name]
    user.last_name = attrs[:last_name]
    user.password = attrs[:password]
    user.password_confirmation = attrs[:password]
    user.admin = attrs[:admin]

    puts "User created: #{user.email}"
  end
end
