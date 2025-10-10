import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CCTVMonitor = () => {
  const { toast } = useToast();
  const [streamUrl, setStreamUrl] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = () => {
    if (!streamUrl) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid RTSP or HTTP stream URL',
        variant: 'destructive',
      });
      return;
    }
    setIsStreaming(true);
    toast({
      title: 'Stream Started',
      description: 'CCTV feed is now live',
    });
  };

  const stopStream = () => {
    setIsStreaming(false);
    toast({
      title: 'Stream Stopped',
      description: 'CCTV feed has been stopped',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            CCTV Camera Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">CCTV Integration Setup:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Enter your camera's RTSP URL (e.g., rtsp://username:password@camera-ip:554/stream)</li>
                  <li>Or HTTP stream URL for IP cameras</li>
                  <li>For motion detection, consider integrating OpenCV on the backend</li>
                  <li>Ensure cameras are on the same network or accessible via internet</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <Label>Camera Stream URL</Label>
            <Input
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="rtsp://username:password@192.168.1.64:554/stream1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={startStream} disabled={isStreaming}>
              Start Stream
            </Button>
            <Button onClick={stopStream} variant="outline" disabled={!isStreaming}>
              Stop Stream
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Camera 1 - Front Entrance</CardTitle>
          </CardHeader>
          <CardContent>
            {isStreaming ? (
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-white space-y-2">
                  <Camera className="w-12 h-12 mx-auto animate-pulse" />
                  <p className="text-sm">Live Stream</p>
                  <p className="text-xs text-gray-400">
                    For actual CCTV integration, you'll need:<br />
                    • Video streaming server (e.g., FFmpeg)<br />
                    • WebRTC or HLS for browser streaming<br />
                    • Backend processing for motion detection
                  </p>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">No stream active</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Camera 2 - Counter Area</CardTitle>
          </CardHeader>
          <CardContent>
            {isStreaming ? (
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-white space-y-2">
                  <Camera className="w-12 h-12 mx-auto animate-pulse" />
                  <p className="text-sm">Live Stream</p>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">No stream active</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Recent motion detection events will appear here...</p>
            {isStreaming && (
              <div className="border-l-2 border-primary pl-4 py-2">
                <p className="font-medium">Motion detected - Front Entrance</p>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};