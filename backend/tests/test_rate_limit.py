import pytest
from app.middleware.rate_limit import rate_limit, reset_rate_limits
from flask import Flask, jsonify

def test_rate_limiting_enforcement():
    test_app = Flask(__name__)

    @test_app.route("/test-limited", methods=["GET"])
    @rate_limit(max_requests=3, window_seconds=60)
    def limited_endpoint():
        return jsonify({"status": "ok"}), 200

    reset_rate_limits()
    client = test_app.test_client()

    # First 3 requests should pass
    for i in range(3):
        res = client.get("/test-limited", environ_base={"REMOTE_ADDR": "192.168.1.100"})
        assert res.status_code == 200

    # 4th request must be rejected with 429 Too Many Requests
    res4 = client.get("/test-limited", environ_base={"REMOTE_ADDR": "192.168.1.100"})
    assert res4.status_code == 429
    data = res4.get_json()
    assert "Rate limit exceeded" in data["message"]

    # Different IP should still be allowed
    res_other = client.get("/test-limited", environ_base={"REMOTE_ADDR": "192.168.1.200"})
    assert res_other.status_code == 200
