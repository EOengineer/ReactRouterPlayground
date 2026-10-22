class CreatePosts < ActiveRecord::Migration[8.1]
  def change
    # posts.user_id is deliberately left unindexed; Lab 2 adds the index.
    create_table :posts do |t|
      t.bigint :user_id, null: false
      t.string :title, null: false
      t.text :body, null: false
      t.integer :likes_count, null: false, default: 0
      t.timestamps
    end
    add_foreign_key :posts, :users
    add_index :posts, :created_at

    add_column :users, :posts_count, :integer, null: false, default: 0
  end
end
