# frozen_string_literal: true

RSpec.shared_examples "requires admin" do
  let(:request_method) { :get }

  it "returns forbidden for a signed-in non-admin" do
    user = create(:user)
    sign_in(user)

    public_send(request_method, request_path, as: :json)

    expect_json_error(:forbidden, "Forbidden")
  end
end
