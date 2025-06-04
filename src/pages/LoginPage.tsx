import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email({ message: "ایمیل نامعتبر است" }),
  password: z.string().min(8, { message: "رمز عبور باید حداقل ۸ کاراکتر باشد" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    console.log("Login attempt:", data);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('Login error:', error);
        
        if (error.message.includes('Email not confirmed') || error.code === 'email_not_confirmed') {
          toast({
            title: "ایمیل تایید نشده",
            description: "لطفاً ایمیل خود را چک کنید و لینک تایید را کلیک کنید. یا از مدیر سایت بخواهید تایید ایمیل را غیرفعال کند.",
            variant: "destructive",
          });
        } else if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "خطا در ورود",
            description: "ایمیل یا رمز عبور اشتباه است",
            variant: "destructive",
          });
        } else {
          toast({
            title: "خطا در ورود",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (authData.user) {
        // چک نقش ادمین
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .eq('role', 'admin')
          .single();

        if (roleData && !roleError) {
          toast({
            title: "ورود موفقیت‌آمیز",
            description: "به پنل مدیریت خوش آمدید",
            variant: "default",
          });
          navigate("/admin");
        } else {
          toast({
            title: "ورود موفقیت‌آمیز",
            description: "به چی کو خوش آمدید",
            variant: "default",
          });
          navigate("/");
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "خطا در ورود",
        description: "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-violet-600">ورود به چی کو</CardTitle>
          <CardDescription className="text-gray-500">
            وارد حساب کاربری خود شوید و آگهی‌های خود را مدیریت کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-fuchsia-600" />
                      ایمیل
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example@email.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-fuchsia-600" />
                      رمز عبور
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="********"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-violet-600"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <Link to="/register" className="font-medium text-violet-600 hover:text-violet-500">
                    ثبت‌نام نکرده‌اید؟
                  </Link>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-violet-600 hover:text-violet-500">
                    فراموشی رمز عبور
                  </a>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-lg py-6"
                disabled={isLoading}
              >
                {isLoading ? "در حال ورود..." : "ورود"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-gray-500 text-sm">
            ورود شما به معنای پذیرش <a href="#" className="text-violet-600">قوانین و مقررات</a> چی کو است
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
