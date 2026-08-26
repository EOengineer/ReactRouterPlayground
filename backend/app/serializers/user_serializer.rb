# frozen_string_literal: true

class UserSerializer
  def self.as_json(user)
    new(user).as_json
  end

  def initialize(user)
    @user = user
  end

  def as_json(*)
    {
      id: @user.id,
      email: @user.email,
      first_name: @user.first_name,
      last_name: @user.last_name,
      admin: @user.admin
    }
  end
end
